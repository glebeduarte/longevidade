-- Programa de ponta a ponta: encontros, check-ins, protocolo, vídeos, e-mails e encerramento

create type public.tipo_encontro as enum ('inicial', 'seguimento', 'final', 'parceiro');
create type public.status_encontro as enum ('previsto', 'agendado', 'realizado', 'faltou', 'cancelado');
create type public.status_checkin as enum ('aberto', 'respondido', 'atendido', 'perdido');

-- Encontros do programa
create table public.encounters (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  number int not null,
  kind public.tipo_encontro not null,
  title text not null,
  target_date date not null,
  scheduled_at timestamptz,
  status public.status_encontro not null default 'previsto',
  location public.local_atendimento,
  notes text,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.encounters (patient_id, target_date);
create index on public.encounters (scheduled_at);

-- Check-ins entre encontros
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  due_date date not null,
  status public.status_checkin not null default 'aberto',
  answers jsonb,
  reaction boolean not null default false,
  submitted_at timestamptz,
  reply text,
  replied_by uuid references public.profiles(id),
  replied_at timestamptz
);
create index on public.checkins (patient_id, due_date);
create index on public.checkins (status, submitted_at);

-- Protocolo com versões
create table public.protocols (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  version int not null,
  intro text,
  items jsonb not null default '[]',
  published_at timestamptz,
  author uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (patient_id, version)
);

-- Vídeos de orientação
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  url text not null,
  duration_min int,
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Fila de e-mails
create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  subject text not null,
  body text not null,
  kind text not null,
  patient_id uuid references public.patients(id) on delete cascade,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  error text
);
create index on public.email_outbox (sent_at, created_at);

alter table public.patients add column if not exists closed_at timestamptz;
alter table public.patients add column if not exists closed_reason text;

-- Ao matricular: gera encontros e a agenda de check-ins (semanal no 1º mês, quinzenal depois)
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
  d := new.start_date + 7;
  while d <= new.end_date loop
    insert into public.checkins (enrollment_id, patient_id, due_date) values (new.id, new.patient_id, d);
    d := d + case when d < new.start_date + 30 then 7 else 14 end;
  end loop;
  return new;
end $$;
create trigger enrollments_gerar after insert on public.enrollments for each row execute function public.gerar_programa();

-- A paciente responde o check-in por esta função (não edita a linha direto)
create or replace function public.responder_checkin(cid uuid, p_answers jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare c record; reacao boolean;
begin
  select * into c from public.checkins where id = cid;
  if c is null or not public.is_my_patient(c.patient_id) then raise exception 'sem acesso'; end if;
  if c.status not in ('aberto', 'perdido') then raise exception 'check-in já respondido'; end if;
  reacao := coalesce((p_answers ->> 'reacao')::boolean, false);
  update public.checkins set answers = p_answers, reaction = reacao, status = 'respondido', submitted_at = now() where id = cid;
  if reacao then
    insert into public.clinical_alerts (patient_id, kind, message)
    values (c.patient_id, 'reacao', 'Possível reação adversa relatada no check-in: ' || coalesce(nullif(p_answers ->> 'reacao_texto', ''), 'sem descrição') || '. Avaliar hoje.');
  end if;
end $$;

-- E-mails automáticos
create or replace function public.email_paciente(pid uuid, p_kind text, p_subject text, p_body text) returns void
language sql security definer set search_path = public as $$
  insert into public.email_outbox (to_email, subject, body, kind, patient_id)
  select email, p_subject, p_body, p_kind, id from public.patients where id = pid and status = 'ativa'
$$;

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
    if new.reply is not null and old.reply is null then
      perform public.email_paciente(new.patient_id, 'checkin_resposta', 'Resposta ao seu check-in',
        'A equipe da Dra. Bartira respondeu ao seu check-in. Veja a mensagem no app.');
    end if;
  elsif tg_table_name = 'protocols' then
    if new.published_at is not null and (tg_op = 'INSERT' or old.published_at is null) then
      perform public.email_paciente(new.patient_id, 'protocolo', 'Seu protocolo foi atualizado',
        'A Dra. Bartira publicou a versão ' || new.version || ' do seu protocolo. Confira em Meu protocolo.');
    end if;
  end if;
  return new;
end $$;
create trigger notifica_questionario after insert on public.questionnaire_assignments for each row execute function public.notificar();
create trigger notifica_mapa after update on public.health_maps for each row execute function public.notificar();
create trigger notifica_checkin after update on public.checkins for each row execute function public.notificar();
create trigger notifica_protocolo after insert or update on public.protocols for each row execute function public.notificar();

-- Lembretes de check-in do dia (chamado pela função de envio)
create or replace function public.enfileirar_lembretes() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into public.email_outbox (to_email, subject, body, kind, patient_id)
  select p.email, 'Hora do seu check-in', 'Seu check-in desta semana está aberto. São 2 minutos para contar como você está.', 'checkin_lembrete', p.id
  from public.checkins c join public.patients p on p.id = c.patient_id
  where c.status = 'aberto' and c.due_date = current_date and p.status = 'ativa'
    and not exists (select 1 from public.email_outbox o where o.patient_id = p.id and o.kind = 'checkin_lembrete' and o.created_at::date = current_date);
  get diagnostics n = row_count;
  -- check-ins vencidos há mais de 3 dias sem resposta viram perdidos
  update public.checkins set status = 'perdido' where status = 'aberto' and due_date < current_date - 3;
  return n;
end $$;

revoke execute on function public.gerar_programa(), public.notificar(), public.email_paciente(uuid, text, text, text), public.enfileirar_lembretes() from anon, authenticated, public;
revoke execute on function public.responder_checkin(uuid, jsonb) from anon, public;
grant execute on function public.responder_checkin(uuid, jsonb) to authenticated;

-- RLS
alter table public.encounters enable row level security;
alter table public.checkins enable row level security;
alter table public.protocols enable row level security;
alter table public.videos enable row level security;
alter table public.email_outbox enable row level security;

create policy en_select on public.encounters for select to authenticated using (public.can_see_patient(patient_id));
create policy en_write on public.encounters for all to authenticated using (public.has_perm('manage_patients')) with check (public.has_perm('manage_patients'));

create policy ck_select on public.checkins for select to authenticated using (public.can_see_patient(patient_id));
create policy ck_update on public.checkins for update to authenticated
  using (public.has_perm('answer_checkins')) with check (public.has_perm('answer_checkins'));

create policy pr_select on public.protocols for select to authenticated
  using (public.has_perm('view_clinical') or (published_at is not null and public.is_my_patient(patient_id)));
create policy pr_write on public.protocols for all to authenticated using (public.has_perm('view_clinical')) with check (public.has_perm('view_clinical'));

create policy vd_select on public.videos for select to authenticated using (active or public.is_medica());
create policy vd_write on public.videos for all to authenticated using (public.is_medica()) with check (public.is_medica());

create policy eo_select on public.email_outbox for select to authenticated using (public.is_medica());

-- Vídeos de exemplo, para trocar pelos links reais
insert into public.videos (title, description, url, duration_min, sort) values
  ('Sangramento no início da reposição', 'O que é esperado nas primeiras semanas e quando avisar a equipe.', 'https://exemplo.com/video-sangramento', 3, 1),
  ('Para que serve cada medicação', 'Estradiol, progesterona e suplementos: o papel de cada um.', 'https://exemplo.com/video-medicacoes', 4, 2),
  ('Como aplicar o gel de estradiol', 'Onde, quando e quanto aplicar.', 'https://exemplo.com/video-gel', 2, 3),
  ('Como medir peso e cintura em casa', 'Passo a passo para medidas comparáveis.', 'https://exemplo.com/video-medidas', 2, 4);
