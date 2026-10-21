-- Check-in avulso, gravação pela médica no modo "Ver como paciente" e correção do envio de questionários

alter table public.checkins alter column enrollment_id drop not null;
alter table public.checkins add column if not exists registrado_por uuid references public.profiles(id);

-- Responder um check-in agendado ou, sem cid, registrar um check-in avulso.
-- Pode ser a própria paciente ou a médica (modo visualização).
create or replace function public.salvar_checkin(cid uuid, p_answers jsonb, pid uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare c record; reacao boolean; alvo uuid; mat uuid;
begin
  reacao := coalesce((p_answers ->> 'reacao')::boolean, false);
  if cid is not null then
    select * into c from public.checkins where id = cid;
    if c is null then raise exception 'check-in não encontrado'; end if;
    alvo := c.patient_id;
  else
    alvo := coalesce(pid, (select id from public.patients where user_id = auth.uid() and status = 'ativa' limit 1));
  end if;
  if alvo is null or not (public.is_my_patient(alvo) or public.is_medica()) then raise exception 'sem acesso'; end if;

  if cid is not null then
    if c.status not in ('aberto', 'perdido') then raise exception 'check-in já respondido'; end if;
    update public.checkins set answers = p_answers, reaction = reacao, status = 'respondido', submitted_at = now(),
      registrado_por = auth.uid() where id = cid;
  else
    select id into mat from public.enrollments where patient_id = alvo and status = 'ativa' order by start_date desc limit 1;
    insert into public.checkins (enrollment_id, patient_id, due_date, status, answers, reaction, submitted_at, registrado_por)
    values (mat, alvo, current_date, 'respondido', p_answers, reacao, now(), auth.uid()) returning id into cid;
  end if;

  if reacao then
    insert into public.clinical_alerts (patient_id, kind, message)
    values (alvo, 'reacao', 'Possível reação adversa relatada no check-in: ' || coalesce(nullif(p_answers ->> 'reacao_texto', ''), 'sem descrição') || '. Avaliar hoje.');
  end if;
  return cid;
end $$;
revoke execute on function public.salvar_checkin(uuid, jsonb, uuid) from anon, public;
grant execute on function public.salvar_checkin(uuid, jsonb, uuid) to authenticated;

-- Questionários: a médica também pode registrar respostas (modo visualização)
alter policy qr_insert on public.questionnaire_responses with check (
  (public.is_my_patient(patient_id) or public.is_medica()) and exists (
    select 1 from public.questionnaire_assignments a
    where a.id = assignment_id and a.patient_id = questionnaire_responses.patient_id
      and a.questionnaire_id = questionnaire_responses.questionnaire_id and a.status = 'pendente'));
