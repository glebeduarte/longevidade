-- Corrige o nome da coluna (full_name) e cria os avisos por WhatsApp para a paciente:
-- conta criada, check-in aberto, questionários novos (agrupados) e resposta da equipe.

create or replace function public.primeiro_nome(pid uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(split_part(full_name, ' ', 1), ''), 'Paciente') from public.patients where id = pid
$$;
revoke execute on function public.primeiro_nome(uuid) from public, anon, authenticated;

-- Avisos para a médica, agora com o nome completo certo
create or replace function public.whatsapp_checkin_respondido() returns trigger
language plpgsql security definer set search_path = public as $$
declare nome text;
begin
  if new.status::text = 'respondido' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    select full_name into nome from public.patients where id = new.patient_id;
    perform public.whatsapp_medica('checkin_respondido',
      jsonb_build_object('paciente', coalesce(nome, 'Paciente'), 'link', 'https://longevidade-black.vercel.app/painel/checkins'),
      new.patient_id);
  end if;
  return new;
end $$;

create or replace function public.whatsapp_questionario_respondido() returns trigger
language plpgsql security definer set search_path = public as $$
declare nome text; quest text;
begin
  select full_name into nome from public.patients where id = new.patient_id;
  select name into quest from public.questionnaires where id = new.questionnaire_id;
  perform public.whatsapp_medica('questionario_respondido',
    jsonb_build_object('paciente', coalesce(nome, 'Paciente'), 'questionario', coalesce(quest, 'questionário'),
      'link', 'https://longevidade-black.vercel.app/painel/pacientes/' || new.patient_id),
    new.patient_id);
  return new;
end $$;

-- Fila para a paciente: usa o telefone da ficha; só pacientes ativas
create or replace function public.whatsapp_paciente(pid uuid, p_event text, p_vars jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare tel text;
begin
  select regexp_replace(coalesce(phone, ''), '\D', '', 'g') into tel from public.patients where id = pid and status = 'ativa';
  if coalesce(length(tel), 0) < 10 then return; end if;
  insert into public.whatsapp_outbox (to_phone, event, vars, patient_id) values (tel, p_event, p_vars, pid);
  perform public.disparar_whatsapp();
end $$;
revoke execute on function public.whatsapp_paciente(uuid, text, jsonb) from public, anon, authenticated;

-- Conta criada
create or replace function public.whatsapp_conta_criada() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.whatsapp_paciente(new.id, 'conta_criada',
    jsonb_build_object('nome', public.primeiro_nome(new.id), 'email', new.email, 'link', 'https://longevidade-black.vercel.app/app'));
  return new;
end $$;
drop trigger if exists whatsapp_conta on public.patients;
create trigger whatsapp_conta after insert on public.patients for each row execute function public.whatsapp_conta_criada();

-- Questionários novos: vários enviados juntos viram uma mensagem só
create or replace function public.whatsapp_questionario_novo() returns trigger
language plpgsql security definer set search_path = public as $$
declare quest text; pendente uuid;
begin
  if new.assigned_by is null then return new; end if;
  select name into quest from public.questionnaires where id = new.questionnaire_id;
  select id into pendente from public.whatsapp_outbox
    where patient_id = new.patient_id and event = 'questionario_novo' and sent_at is null and tentativas = 0
      and created_at > now() - interval '2 minutes'
    order by created_at desc limit 1;
  if pendente is not null then
    update public.whatsapp_outbox
      set vars = jsonb_set(vars, '{questionarios}', to_jsonb((vars->>'questionarios') || ', ' || coalesce(quest, 'questionário')))
      where id = pendente;
  else
    perform public.whatsapp_paciente(new.patient_id, 'questionario_novo',
      jsonb_build_object('nome', public.primeiro_nome(new.patient_id), 'questionarios', coalesce(quest, 'questionário'),
        'link', 'https://longevidade-black.vercel.app/app/questionarios'));
  end if;
  return new;
end $$;
drop trigger if exists whatsapp_questionario_novo on public.questionnaire_assignments;
create trigger whatsapp_questionario_novo after insert on public.questionnaire_assignments
  for each row execute function public.whatsapp_questionario_novo();

-- Resposta da equipe ao check-in
create or replace function public.whatsapp_resposta_equipe() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.reply is not null and new.reply is distinct from old.reply then
    perform public.whatsapp_paciente(new.patient_id, 'resposta_equipe',
      jsonb_build_object('nome', public.primeiro_nome(new.patient_id), 'link', 'https://longevidade-black.vercel.app/app'));
  end if;
  return new;
end $$;
drop trigger if exists whatsapp_resposta on public.checkins;
create trigger whatsapp_resposta after update of reply on public.checkins
  for each row execute function public.whatsapp_resposta_equipe();

-- Check-in aberto: no dia do check-in, às 9h de Natal (12h UTC), uma vez por dia
create or replace function public.whatsapp_checkins_do_dia() returns int
language plpgsql security definer set search_path = public as $$
declare c record; n int := 0;
begin
  for c in
    select distinct ck.patient_id from public.checkins ck join public.patients p on p.id = ck.patient_id
    where ck.status = 'aberto' and ck.due_date = current_date and p.status = 'ativa'
      and not exists (select 1 from public.whatsapp_outbox o where o.patient_id = ck.patient_id
        and o.event = 'checkin_aberto' and o.created_at::date = current_date)
  loop
    perform public.whatsapp_paciente(c.patient_id, 'checkin_aberto',
      jsonb_build_object('nome', public.primeiro_nome(c.patient_id), 'link', 'https://longevidade-black.vercel.app/app/checkin'));
    n := n + 1;
  end loop;
  return n;
end $$;

revoke execute on function public.whatsapp_conta_criada(), public.whatsapp_questionario_novo(), public.whatsapp_resposta_equipe(),
  public.whatsapp_checkins_do_dia() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'whatsapp-checkin';
select cron.schedule('whatsapp-checkin', '0 12 * * *', $$ select public.whatsapp_checkins_do_dia() $$);
