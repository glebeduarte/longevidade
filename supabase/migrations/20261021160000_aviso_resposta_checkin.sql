-- Resposta do check-in: aviso na tela inicial da paciente (com "lido") e e-mail com o texto da resposta

alter table public.checkins add column if not exists reply_seen_at timestamptz;

-- Nova resposta ou resposta editada volta a aparecer como não lida
create or replace function public.resposta_nao_lida() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.reply is distinct from old.reply then new.reply_seen_at := null; end if;
  return new;
end $$;
create trigger checkin_resposta_nao_lida before update on public.checkins for each row execute function public.resposta_nao_lida();

-- A paciente marca a resposta como lida (só a dela)
create or replace function public.marcar_resposta_lida(cid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.checkins set reply_seen_at = now()
  where id = cid and reply is not null and public.is_my_patient(patient_id);
end $$;
revoke execute on function public.marcar_resposta_lida(uuid) from anon, public;
grant execute on function public.marcar_resposta_lida(uuid) to authenticated;

create or replace function public.notificar() returns trigger
language plpgsql security definer set search_path = public as $$
declare nome text;
begin
  if tg_table_name = 'questionnaire_assignments' then
    if new.assigned_by is not null then
      select name into nome from public.questionnaires where id = new.questionnaire_id;
      perform public.email_paciente(new.patient_id, 'questionario', 'Novo questionário para responder',
        'A Dra. Bartira enviou o questionário "' || nome || '". Leva poucos minutos e deixa o seu encontro mais focado no que importa para você.');
    end if;
  elsif tg_table_name = 'health_maps' then
    if new.status = 'finalizado' and old.status is distinct from 'finalizado' then
      perform public.email_paciente(new.patient_id, 'mapa', 'Seu Mapa da Saúde está pronto',
        'Seu Mapa da Saúde foi revisado pela Dra. Bartira e já está disponível em Minha evolução.');
    end if;
  elsif tg_table_name = 'checkins' then
    if new.reply is not null and new.reply is distinct from old.reply then
      perform public.email_paciente(new.patient_id, 'checkin_resposta', 'Resposta ao seu check-in',
        'A equipe da Dra. Bartira respondeu ao seu check-in:<br><br><i>'
        || replace(replace(replace(new.reply, '&', '&amp;'), '<', '&lt;'), '>', '&gt;')
        || '</i><br><br>A mensagem também está na tela inicial do app.');
    end if;
  elsif tg_table_name = 'protocols' then
    if new.published_at is not null and (tg_op = 'INSERT' or old.published_at is null) then
      perform public.email_paciente(new.patient_id, 'protocolo', 'Seu protocolo foi atualizado',
        'A Dra. Bartira publicou a versão ' || new.version || ' do seu protocolo. Confira em Meu protocolo.');
    end if;
  end if;
  return new;
end $$;

-- 28/10: a médica também confirma no modo "Ver como paciente"; confirmar marca as anteriores não lidas
create or replace function public.marcar_resposta_lida(cid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare alvo uuid; quando timestamptz;
begin
  select patient_id, replied_at into alvo, quando from public.checkins where id = cid and reply is not null;
  if alvo is null or not (public.is_my_patient(alvo) or public.is_medica()) then return; end if;
  update public.checkins set reply_seen_at = now()
  where patient_id = alvo and reply is not null and reply_seen_at is null
    and (id = cid or coalesce(replied_at, 'epoch') <= coalesce(quando, now()));
end $$;
