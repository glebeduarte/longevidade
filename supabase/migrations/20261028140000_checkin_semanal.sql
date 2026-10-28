-- Check-in semanal (material de 28/10/2026): toda semana, aberto na quinta para o contato de sexta,
-- blocos por tratamento (GLP-1/tirzepatida e terapia hormonal) e alertas que não esperam a sexta.

-- Tratamentos ativos da paciente, a partir das condutas e receitas vigentes
create or replace function public.meus_tratamentos(pid uuid default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare alvo uuid; texto text;
begin
  alvo := coalesce(pid, (select id from public.patients where user_id = auth.uid() and status = 'ativa' limit 1));
  if alvo is null or not (public.is_my_patient(alvo) or public.can_see_patient(alvo)) then return '{"glp1": false, "thm": false}'; end if;
  select coalesce(string_agg(t, ' '), '') into texto from (
    select title || ' ' || coalesce(detail, '') t from public.conducts where patient_id = alvo and active and kind = 'medicacao'
    union all
    select i ->> 'nome' || ' ' || coalesce(i ->> 'principio', '') from public.prescriptions p, jsonb_array_elements(p.itens) i
      where p.patient_id = alvo and p.active and p.valida_ate >= current_date
  ) x;
  return jsonb_build_object(
    'glp1', texto ~* '(tirzepatida|semaglutida|liraglutida|dulaglutida|exenatida|lixisenatida|mounjaro|ozempic|wegovy|rybelsus|saxenda|victoza|trulicity)',
    'thm', texto ~* '(estradiol|estrog|estriol|progesterona|progestag|didrogesterona|tibolona|oestrogel|estreva|utrogestan|premarin|terapia hormonal|trh|thm|drospirenona|nomegestrol|levonorgestrel)'
  );
end $$;
revoke execute on function public.meus_tratamentos(uuid) from anon, public;
grant execute on function public.meus_tratamentos(uuid) to authenticated;

-- Alertas que não esperam a sexta viram alerta urgente para a médica
create or replace function public.salvar_checkin(cid uuid, p_answers jsonb, pid uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare c record; reacao boolean; alvo uuid; mat uuid; urg text;
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
  select string_agg(value, '; ') into urg from jsonb_array_elements_text(coalesce(p_answers -> 'alertas', '[]'));
  if urg is not null then
    insert into public.clinical_alerts (patient_id, kind, message)
    values (alvo, 'urgente', 'Sinal de alerta marcado no check-in: ' || urg || '. A paciente foi orientada a procurar atendimento imediato. Contatar hoje.');
  end if;
  if reacao then
    insert into public.clinical_alerts (patient_id, kind, message)
    values (alvo, 'reacao', 'Possível reação adversa no check-in: ' || coalesce(nullif(p_answers ->> 'reacao_texto', ''), 'sem descrição') || '.');
  end if;
  return cid;
end $$;

-- Novos programas: check-in toda semana, às quintas, até o fim do programa
create or replace function public.gerar_programa() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  prog record; n int; i int; d date; titulo text; tipo public.tipo_encontro; loc public.local_atendimento;
begin
  select * into prog from public.programs where id = new.program_id;
  select location into loc from public.patients where id = new.patient_id;
  n := prog.encounters;
  for i in 1..n loop
    d := new.start_date + ((new.end_date - new.start_date) * (i - 1) / greatest(n - 1, 1));
    tipo := case when i = 1 then 'inicial' when i = n then 'final' else 'seguimento' end;
    titulo := case when i = 1 then 'Encontro inicial' when i = n then 'Encontro de encerramento' else 'Encontro de seguimento ' || (i - 1) end;
    insert into public.encounters (enrollment_id, patient_id, number, kind, title, target_date, location, status, scheduled_at)
    values (new.id, new.patient_id, i, tipo, titulo, d, loc, case when i = 1 then 'agendado'::public.status_encontro else 'previsto'::public.status_encontro end,
            case when i = 1 then (new.start_date::timestamp + time '09:00') at time zone 'America/Sao_Paulo' end);
  end loop;
  if prog.slug = 'completo' then
    insert into public.encounters (enrollment_id, patient_id, number, kind, title, target_date, status) values
      (new.id, new.patient_id, n + 1, 'parceiro', 'Consulta com cardiologista parceiro', new.start_date + 30, 'previsto'),
      (new.id, new.patient_id, n + 2, 'parceiro', 'Consulta com nutricionista parceira', new.start_date + 21, 'previsto');
  end if;
  -- primeira quinta-feira a pelo menos 5 dias do início
  d := new.start_date + 5;
  d := d + ((4 - extract(isodow from d)::int + 7) % 7);
  while d <= new.end_date loop
    insert into public.checkins (enrollment_id, patient_id, due_date) values (new.id, new.patient_id, d);
    d := d + 7;
  end loop;
  return new;
end $$;

-- Programas em andamento: futuros check-ins abertos passam para a quinta da mesma semana,
-- e as semanas sem check-in ganham um
update public.checkins c set due_date = c.due_date + (4 - extract(isodow from c.due_date)::int)
from public.enrollments e
where e.id = c.enrollment_id and e.status = 'ativa' and c.status = 'aberto' and c.due_date > current_date;

insert into public.checkins (enrollment_id, patient_id, due_date)
select e.id, e.patient_id, s.d::date
from public.enrollments e
cross join lateral generate_series(
  (current_date + ((4 - extract(isodow from current_date)::int + 7) % 7))::timestamp, e.end_date::timestamp, interval '7 days') s(d)
where e.status = 'ativa'
  and not exists (select 1 from public.checkins c where c.enrollment_id = e.id and c.due_date = s.d::date);
