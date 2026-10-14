-- Fase 06/07 (parte 1): questionários com escore automático, alertas clínicos e bioimpedância

create type public.nivel_faixa as enum ('ruim', 'atencao', 'normal', 'bom', 'otimo');
create type public.tipo_pergunta as enum ('escolha', 'sim_nao', 'numero');
create type public.status_envio as enum ('pendente', 'respondido', 'cancelado');
create type public.tipo_alerta as enum ('ideacao', 'reacao');

create table public.questionnaires (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  domain text not null,
  instructions text,
  scored boolean not null default true,
  sort int not null default 0,
  active boolean not null default true
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.questionnaires(id) on delete cascade,
  position int not null,
  text text not null,
  kind public.tipo_pergunta not null default 'escolha',
  options jsonb not null default '[]',
  scored boolean not null default true,
  alert_if_gt numeric,
  unique (questionnaire_id, position)
);

create table public.scoring_bands (
  id uuid primary key default gen_random_uuid(),
  questionnaire_id uuid not null references public.questionnaires(id) on delete cascade,
  min_score numeric not null,
  max_score numeric not null,
  label text not null,
  level public.nivel_faixa not null
);

create table public.questionnaire_assignments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  questionnaire_id uuid not null references public.questionnaires(id),
  status public.status_envio not null default 'pendente',
  assigned_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid unique not null references public.questionnaire_assignments(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  questionnaire_id uuid not null references public.questionnaires(id),
  answers jsonb not null,
  score numeric,
  band_label text,
  band_level public.nivel_faixa,
  flagged boolean not null default false,
  submitted_at timestamptz not null default now()
);

create table public.clinical_alerts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  kind public.tipo_alerta not null,
  source_response_id uuid references public.questionnaire_responses(id) on delete set null,
  message text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id),
  resolution_note text
);

create table public.bioimpedance (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  measured_at timestamptz not null,
  device text not null default 'InBody 270',
  weight numeric, body_water numeric, protein numeric, minerals numeric, fat_mass numeric,
  smm numeric, ffm numeric, bmi numeric, pbf numeric, whr numeric, visceral_level numeric,
  obesity_degree numeric, bmr numeric, smi numeric, inbody_score numeric, recommended_kcal numeric,
  segmental jsonb not null default '{}',
  impedance jsonb not null default '{}',
  file_path text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index on public.questions (questionnaire_id, position);
create index on public.questionnaire_assignments (patient_id, status);
create index on public.questionnaire_responses (patient_id, submitted_at desc);
create index on public.clinical_alerts (resolved_at, created_at desc);
create index on public.bioimpedance (patient_id, measured_at desc);

create or replace function public.is_my_patient(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.patients where id = pid and user_id = auth.uid() and status = 'ativa')
$$;

-- Calcula escore, faixa e alerta no momento da resposta
create or replace function public.score_response() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  q record;
  v numeric;
  total numeric := 0;
  has_score boolean;
  b record;
begin
  select scored into has_score from public.questionnaires where id = new.questionnaire_id;

  for q in select * from public.questions where questionnaire_id = new.questionnaire_id loop
    v := nullif(new.answers ->> q.id::text, '')::numeric;
    if v is not null and q.scored then total := total + v; end if;
    if v is not null and q.alert_if_gt is not null and v > q.alert_if_gt then
      new.flagged := true;
    end if;
  end loop;

  if has_score then
    new.score := round(total, 2);
    select label, level into b from public.scoring_bands
      where questionnaire_id = new.questionnaire_id and total between min_score and max_score
      order by min_score limit 1;
    new.band_label := b.label;
    new.band_level := b.level;
  end if;
  return new;
end $$;

create or replace function public.after_response() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.questionnaire_assignments set status = 'respondido' where id = new.assignment_id;
  if new.flagged then
    insert into public.clinical_alerts (patient_id, kind, source_response_id, message)
    values (new.patient_id, 'ideacao', new.id,
      'Resposta positiva no item 9 do PHQ-9 (pensamentos de morte ou de se machucar). Avaliar hoje.');
  end if;
  return new;
end $$;

create trigger responses_score before insert on public.questionnaire_responses
  for each row execute function public.score_response();
create trigger responses_after after insert on public.questionnaire_responses
  for each row execute function public.after_response();

revoke execute on function public.score_response(), public.after_response() from anon, authenticated, public;
revoke execute on function public.is_my_patient(uuid) from anon, public;
grant execute on function public.is_my_patient(uuid) to authenticated;

-- RLS
alter table public.questionnaires enable row level security;
alter table public.questions enable row level security;
alter table public.scoring_bands enable row level security;
alter table public.questionnaire_assignments enable row level security;
alter table public.questionnaire_responses enable row level security;
alter table public.clinical_alerts enable row level security;
alter table public.bioimpedance enable row level security;

create policy qn_select on public.questionnaires for select to authenticated using (true);
create policy qn_write on public.questionnaires for all to authenticated using (public.is_medica()) with check (public.is_medica());
create policy qq_select on public.questions for select to authenticated using (true);
create policy qq_write on public.questions for all to authenticated using (public.is_medica()) with check (public.is_medica());
create policy qb_select on public.scoring_bands for select to authenticated using (true);
create policy qb_write on public.scoring_bands for all to authenticated using (public.is_medica()) with check (public.is_medica());

create policy qa_select on public.questionnaire_assignments for select to authenticated using (public.can_see_patient(patient_id));
create policy qa_insert on public.questionnaire_assignments for insert to authenticated with check (public.has_perm('manage_patients'));
create policy qa_update on public.questionnaire_assignments for update to authenticated
  using (public.has_perm('manage_patients')) with check (public.has_perm('manage_patients'));

create policy qr_select on public.questionnaire_responses for select to authenticated using (public.can_see_patient(patient_id));
create policy qr_insert on public.questionnaire_responses for insert to authenticated with check (
  public.is_my_patient(patient_id) and exists (
    select 1 from public.questionnaire_assignments a
    where a.id = assignment_id and a.patient_id = questionnaire_responses.patient_id
      and a.questionnaire_id = questionnaire_responses.questionnaire_id and a.status = 'pendente'));

create policy al_select on public.clinical_alerts for select to authenticated
  using (public.is_medica() or public.has_perm('answer_checkins') or public.has_perm('view_clinical'));
create policy al_update on public.clinical_alerts for update to authenticated
  using (public.is_medica()) with check (public.is_medica());

create policy bi_select on public.bioimpedance for select to authenticated using (public.can_see_patient(patient_id));
create policy bi_insert on public.bioimpedance for insert to authenticated with check (public.has_perm('upload_measurements'));
create policy bi_update on public.bioimpedance for update to authenticated
  using (public.has_perm('upload_measurements')) with check (public.has_perm('upload_measurements'));
create policy bi_delete on public.bioimpedance for delete to authenticated using (public.is_medica());

-- Arquivos clínicos (privado). Caminho: <patient_id>/<arquivo>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('clinico', 'clinico', false, 15728640, array['image/jpeg','image/png','image/heic','application/pdf'])
on conflict (id) do nothing;

create policy clinico_select on storage.objects for select to authenticated
  using (bucket_id = 'clinico' and public.can_see_patient(((storage.foldername(name))[1])::uuid));
create policy clinico_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'clinico' and public.has_perm('upload_measurements'));
