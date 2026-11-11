-- Integração com o Resend: envio automático da fila, avisos para a equipe e textos com "plano de cuidado".

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Configuração dos envios (lida só pelo servidor)
create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;
create table if not exists privado.config (chave text primary key, valor text not null);
insert into privado.config values
  ('email_equipe', 'bartiraendocrino@gmail.com'),
  ('email_medica', 'bartiraendocrino@gmail.com'),
  ('cron_token', encode(gen_random_bytes(24), 'hex'))
on conflict (chave) do nothing;

create or replace function public.cron_token_ok(t text) returns boolean
language sql stable security definer set search_path = privado as $$
  select exists (select 1 from privado.config where chave = 'cron_token' and valor = t)
$$;
revoke execute on function public.cron_token_ok(text) from public, anon, authenticated;
grant execute on function public.cron_token_ok(text) to service_role;

create or replace function public.email_interno(p_dest text, p_kind text, p_subject text, p_body text) returns void
language sql security definer set search_path = public, privado as $$
  insert into public.email_outbox (to_email, subject, body, kind)
  select valor, p_subject, p_body, p_kind from privado.config where chave = p_dest
$$;
revoke execute on function public.email_interno(text, text, text, text) from public, anon, authenticated;

-- Pacientes de teste nunca recebem e-mail
create or replace function public.email_paciente(pid uuid, p_kind text, p_subject text, p_body text) returns void
language sql security definer set search_path = public as $$
  insert into public.email_outbox (to_email, subject, body, kind, patient_id)
  select email, p_subject, p_body, p_kind, id from public.patients
  where id = pid and status = 'ativa' and email not like '%@teste.longevidade'
$$;

-- Texto do aviso de publicação: "plano de cuidado"
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
      perform public.email_paciente(new.patient_id, 'protocolo', 'Seu plano de cuidado foi atualizado',
        'A Dra. Bartira publicou a versão ' || new.version || ' do seu plano de cuidado. Confira em Meu plano de cuidado, no app.');
    end if;
  end if;
  return new;
end $$;

-- Aviso à médica quando surge alerta urgente ou de reação (sem dado clínico no e-mail)
create or replace function public.avisar_alerta() returns trigger
language plpgsql security definer set search_path = public as $$
declare nome text;
begin
  if new.kind::text in ('urgente', 'reacao') then
    select split_part(name, ' ', 1) into nome from public.patients where id = new.patient_id and email not like '%@teste.longevidade';
    if nome is null then return new; end if;
    perform public.email_interno('email_medica', 'alerta',
      case when new.kind::text = 'urgente' then 'Alerta urgente no check-in' else 'Possível reação adversa no check-in' end,
      'A paciente ' || nome || ' marcou um sinal que pede atenção hoje. Abra o painel, em Hoje, para ver os detalhes.');
  end if;
  return new;
end $$;
drop trigger if exists avisa_alerta on public.clinical_alerts;
create trigger avisa_alerta after insert on public.clinical_alerts for each row execute function public.avisar_alerta();

-- Aviso à equipe quando alguém baixa um material pelo site
create or replace function public.avisar_lead() returns trigger
language plpgsql security definer set search_path = public as $$
declare t text;
begin
  select titulo into t from public.landing_pages where id = new.landing_id;
  perform public.email_interno('email_equipe', 'lead', 'Novo contato pelo site: ' || t,
    replace(replace(new.nome, '<', '&lt;'), '>', '&gt;') || ' pediu o material <b>' || t || '</b>.<br>E-mail: ' || new.email
    || coalesce('<br>WhatsApp: ' || new.whatsapp, '') || '<br><br>A lista completa está no painel, em Site.');
  return new;
end $$;
drop trigger if exists avisa_lead on public.leads;
create trigger avisa_lead after insert on public.leads for each row execute function public.avisar_lead();

revoke execute on function public.avisar_alerta(), public.avisar_lead() from public, anon, authenticated;

-- A fila acumulada antes da ativação não é disparada de uma vez
update public.email_outbox set sent_at = now(), error = 'não enviado: fila anterior à ativação do Resend' where sent_at is null;

-- Envio automático a cada 5 minutos (lembretes de check-in entram na mesma chamada)
select cron.unschedule(jobid) from cron.job where jobname = 'enviar-emails';
select cron.schedule('enviar-emails', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://iabuqhwwpuqfleqmkufz.supabase.co/functions/v1/enviar-emails',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-token', (select valor from privado.config where chave = 'cron_token')),
    body := '{}'::jsonb)
$$);
