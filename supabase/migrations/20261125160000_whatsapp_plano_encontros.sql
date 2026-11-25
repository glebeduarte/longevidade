-- WhatsApp: plano de cuidado (publicado ou reenviado), confirmação de agendamento
-- e lembretes dos encontros 30, 15, 7, 3 e 1 dia antes e 6 horas antes, dizendo com quem é a consulta.

alter table public.whatsapp_outbox add column if not exists ref_id uuid;
create index if not exists whatsapp_outbox_ref on public.whatsapp_outbox (ref_id, event);

-- Plano de cuidado publicado
create or replace function public.whatsapp_plano_cuidado() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.published_at is not null and (tg_op = 'INSERT' or old.published_at is null) then
    perform public.whatsapp_paciente(new.patient_id, 'plano_cuidado',
      jsonb_build_object('nome', public.primeiro_nome(new.patient_id), 'acao', 'publicou o seu plano de cuidado',
        'link', 'https://bartirareboucas.com.br/app/protocolo'));
  end if;
  return new;
end $$;
drop trigger if exists whatsapp_plano_cuidado on public.protocols;
create trigger whatsapp_plano_cuidado after insert or update of published_at on public.protocols
  for each row execute function public.whatsapp_plano_cuidado();

-- Reenvio do plano de cuidado pelo painel (e-mail e WhatsApp)
create or replace function public.reenviar_plano_cuidado(pid uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare v int;
begin
  if not (public.is_medica() or public.has_perm('manage_patients')) then raise exception 'sem permissão'; end if;
  select version into v from public.protocols where patient_id = pid and published_at is not null order by version desc limit 1;
  if v is null then return false; end if;
  perform public.email_paciente(pid, 'protocolo', 'Seu plano de cuidado',
    'A Dra. Bartira reenviou a versão ' || v || ' do seu plano de cuidado. Confira em Meu plano de cuidado, no app.');
  perform public.whatsapp_paciente(pid, 'plano_cuidado',
    jsonb_build_object('nome', public.primeiro_nome(pid), 'acao', 'reenviou o seu plano de cuidado',
      'link', 'https://bartirareboucas.com.br/app/protocolo'));
  return true;
end $$;
revoke execute on function public.reenviar_plano_cuidado(uuid) from public, anon;
grant execute on function public.reenviar_plano_cuidado(uuid) to authenticated;

-- Dados do encontro para as mensagens
create or replace function public.whatsapp_vars_encontro(e public.encounters) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'nome', public.primeiro_nome(e.patient_id),
    'consulta', coalesce(e.title, 'Encontro do programa Longevidade'),
    'com_quem', case when e.kind::text = 'parceiro' and e.title ilike 'consulta com %' then substring(e.title from 14)
                     when e.kind::text = 'parceiro' then 'profissional parceiro do programa'
                     else 'Dra. Bartira Rebouças' end,
    'data', to_char(e.scheduled_at at time zone 'America/Fortaleza', 'DD/MM/YYYY'),
    'hora', to_char(e.scheduled_at at time zone 'America/Fortaleza', 'HH24"h"MI'),
    'local', case e.location::text when 'equilibre' then 'Clínica Equilibre' when 'spinel' then 'Instituto Spinel' else 'local a confirmar' end,
    'agendado', e.scheduled_at,
    'link', 'https://bartirareboucas.com.br/app')
$$;
revoke execute on function public.whatsapp_vars_encontro(public.encounters) from public, anon, authenticated;

create or replace function public.whatsapp_encontro(e public.encounters, p_event text, p_extra jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare tel text;
begin
  select regexp_replace(coalesce(phone, ''), '\D', '', 'g') into tel from public.patients where id = e.patient_id and status = 'ativa';
  if coalesce(length(tel), 0) < 10 then return; end if;
  insert into public.whatsapp_outbox (to_phone, event, vars, patient_id, ref_id)
    values (tel, p_event, public.whatsapp_vars_encontro(e) || p_extra, e.patient_id, e.id);
  perform public.disparar_whatsapp();
end $$;
revoke execute on function public.whatsapp_encontro(public.encounters, text, jsonb) from public, anon, authenticated;

-- Confirmação: ao agendar ou mudar a data
create or replace function public.whatsapp_agendamento() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status::text = 'agendado' and new.scheduled_at is not null and new.scheduled_at > now()
     and (tg_op = 'INSERT' or old.status is distinct from new.status or old.scheduled_at is distinct from new.scheduled_at) then
    perform public.whatsapp_encontro(new, 'agendamento_confirmado', '{}'::jsonb);
  end if;
  return new;
end $$;
drop trigger if exists whatsapp_agendamento on public.encounters;
create trigger whatsapp_agendamento after insert or update of status, scheduled_at on public.encounters
  for each row execute function public.whatsapp_agendamento();

-- Lembretes: roda a cada 15 minutos; cada marco sai uma vez por data agendada
create or replace function public.whatsapp_lembretes_encontros() returns int
language plpgsql security definer set search_path = public as $$
declare e public.encounters; m record; n int := 0;
begin
  for m in select * from (values
      ('30d', interval '30 days', interval '12 hours', 'daqui a 30 dias'),
      ('15d', interval '15 days', interval '12 hours', 'daqui a 15 dias'),
      ('7d',  interval '7 days',  interval '12 hours', 'daqui a 7 dias'),
      ('3d',  interval '3 days',  interval '12 hours', 'daqui a 3 dias'),
      ('1d',  interval '1 day',   interval '6 hours',  'amanhã'),
      ('6h',  interval '6 hours', interval '2 hours',  'hoje, daqui a 6 horas')) as t(marco, antes, janela, quando)
  loop
    for e in
      select en.* from public.encounters en
      where en.status = 'agendado' and en.scheduled_at is not null
        and now() >= en.scheduled_at - m.antes and now() < en.scheduled_at - m.antes + m.janela
        and not exists (select 1 from public.whatsapp_outbox o where o.ref_id = en.id and o.event = 'encontro_lembrete'
          and o.vars->>'marco' = m.marco and (o.vars->>'agendado')::timestamptz = en.scheduled_at)
    loop
      perform public.whatsapp_encontro(e, 'encontro_lembrete', jsonb_build_object('marco', m.marco, 'quando', m.quando));
      n := n + 1;
    end loop;
  end loop;
  return n;
end $$;
revoke execute on function public.whatsapp_plano_cuidado(), public.whatsapp_agendamento(), public.whatsapp_lembretes_encontros()
  from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'whatsapp-lembretes-encontros';
select cron.schedule('whatsapp-lembretes-encontros', '*/15 * * * *', $$ select public.whatsapp_lembretes_encontros() $$);
