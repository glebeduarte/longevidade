-- Avisos por WhatsApp pelo MasterZap (app.masterzapbr.com).
-- A chave fica no segredo MASTERZAP_API_KEY da função enviar-whatsapp; os textos ficam nos modelos do MasterZap.
-- Nenhum dado clínico vai na mensagem: só o primeiro nome e o link do painel.

create table if not exists public.whatsapp_outbox (
  id uuid primary key default gen_random_uuid(),
  to_phone text not null,
  event text not null,
  vars jsonb not null default '{}'::jsonb,
  patient_id uuid references public.patients(id) on delete set null,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  tentativas int not null default 0,
  status_http int,
  error text
);
create index if not exists whatsapp_outbox_pendentes on public.whatsapp_outbox (created_at) where sent_at is null;
alter table public.whatsapp_outbox enable row level security;
create policy "medica le historico whatsapp" on public.whatsapp_outbox for select using (public.is_medica());

insert into privado.config values ('whatsapp_medica', '') on conflict (chave) do nothing;

-- Número que recebe os avisos (só a médica lê e altera)
create or replace function public.whatsapp_aviso_numero() returns text
language plpgsql stable security definer set search_path = public, privado as $$
begin
  if not public.is_medica() then raise exception 'sem permissão'; end if;
  return (select valor from privado.config where chave = 'whatsapp_medica');
end $$;

create or replace function public.salvar_whatsapp_aviso(p_numero text) returns text
language plpgsql security definer set search_path = public, privado as $$
declare n text := regexp_replace(coalesce(p_numero, ''), '\D', '', 'g');
begin
  if not public.is_medica() then raise exception 'sem permissão'; end if;
  if n <> '' and length(n) not between 10 and 13 then raise exception 'Número inválido. Use DDD e número, ex.: 84999998888'; end if;
  update privado.config set valor = n where chave = 'whatsapp_medica';
  return n;
end $$;
revoke execute on function public.whatsapp_aviso_numero(), public.salvar_whatsapp_aviso(text) from public, anon;
grant execute on function public.whatsapp_aviso_numero(), public.salvar_whatsapp_aviso(text) to authenticated;

-- Chama a função de envio na hora (o agendamento abaixo reenvia o que falhar)
create or replace function public.disparar_whatsapp() returns void
language sql security definer set search_path = public, privado as $$
  select net.http_post(
    url := 'https://iabuqhwwpuqfleqmkufz.supabase.co/functions/v1/enviar-whatsapp',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-token', (select valor from privado.config where chave = 'cron_token')),
    body := '{}'::jsonb);
$$;

create or replace function public.whatsapp_medica(p_event text, p_vars jsonb, p_patient uuid) returns void
language plpgsql security definer set search_path = public, privado as $$
declare n text;
begin
  select valor into n from privado.config where chave = 'whatsapp_medica';
  if coalesce(n, '') = '' then return; end if;
  insert into public.whatsapp_outbox (to_phone, event, vars, patient_id) values (n, p_event, p_vars, p_patient);
  perform public.disparar_whatsapp();
end $$;
revoke execute on function public.disparar_whatsapp(), public.whatsapp_medica(text, jsonb, uuid) from public, anon, authenticated;

-- Check-in enviado
create or replace function public.whatsapp_checkin_respondido() returns trigger
language plpgsql security definer set search_path = public as $$
declare nome text;
begin
  if new.status::text = 'respondido' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    select name into nome from public.patients where id = new.patient_id;
    perform public.whatsapp_medica('checkin_respondido',
      jsonb_build_object('paciente', coalesce(nome, 'Paciente'), 'link', 'https://longevidade-black.vercel.app/painel/checkins'),
      new.patient_id);
  end if;
  return new;
end $$;
drop trigger if exists whatsapp_checkin on public.checkins;
create trigger whatsapp_checkin after insert or update of status on public.checkins
  for each row execute function public.whatsapp_checkin_respondido();

-- Questionário respondido
create or replace function public.whatsapp_questionario_respondido() returns trigger
language plpgsql security definer set search_path = public as $$
declare nome text; quest text;
begin
  select name into nome from public.patients where id = new.patient_id;
  select name into quest from public.questionnaires where id = new.questionnaire_id;
  perform public.whatsapp_medica('questionario_respondido',
    jsonb_build_object('paciente', coalesce(nome, 'Paciente'), 'questionario', coalesce(quest, 'questionário'),
      'link', 'https://longevidade-black.vercel.app/painel/pacientes/' || new.patient_id),
    new.patient_id);
  return new;
end $$;
drop trigger if exists whatsapp_questionario on public.questionnaire_responses;
create trigger whatsapp_questionario after insert on public.questionnaire_responses
  for each row execute function public.whatsapp_questionario_respondido();

revoke execute on function public.whatsapp_checkin_respondido(), public.whatsapp_questionario_respondido() from public, anon, authenticated;

-- Reenvio do que ficou pendente, a cada 5 minutos
select cron.unschedule(jobid) from cron.job where jobname = 'enviar-whatsapp';
select cron.schedule('enviar-whatsapp', '*/5 * * * *', $$ select public.disparar_whatsapp() $$);
