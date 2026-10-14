-- Fase 02: núcleo de acesso e LGPD

create type public.app_role as enum ('medica', 'equipe', 'paciente');
create type public.local_atendimento as enum ('equilibre', 'spinel');
create type public.status_paciente as enum ('ativa', 'encerrada');
create type public.status_matricula as enum ('ativa', 'concluida', 'cancelada');

-- Perfis (1:1 com auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role public.app_role not null default 'paciente',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Permissões da equipe, por pessoa
create table public.team_permissions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  can_manage_patients boolean not null default false,
  can_upload_measurements boolean not null default false,
  can_answer_checkins boolean not null default false,
  can_view_clinical boolean not null default false,
  is_partner boolean not null default false,
  partner_specialty text,
  updated_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  birth_date date,
  location public.local_atendimento,
  status public.status_paciente not null default 'ativa',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.partner_assignments (
  partner_id uuid references public.profiles(id) on delete cascade,
  patient_id uuid references public.patients(id) on delete cascade,
  primary key (partner_id, patient_id)
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  duration_months int not null,
  encounters int not null,
  price_cents int not null,
  active boolean not null default true
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  program_id uuid not null references public.programs(id),
  start_date date not null,
  end_date date not null,
  status public.status_matricula not null default 'ativa',
  created_at timestamptz not null default now()
);

create table public.consent_terms (
  id uuid primary key default gen_random_uuid(),
  version text unique not null,
  body text not null,
  published_at timestamptz
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  term_id uuid not null references public.consent_terms(id),
  accepted_at timestamptz not null default now(),
  user_agent text,
  unique (user_id, term_id)
);

create table public.access_logs (
  id bigint generated always as identity primary key,
  actor_id uuid not null references public.profiles(id),
  patient_id uuid references public.patients(id) on delete set null,
  resource text not null,
  action text not null,
  at timestamptz not null default now()
);

create index on public.enrollments (patient_id);
create index on public.access_logs (patient_id, at desc);
create index on public.partner_assignments (patient_id);

-- Funções de apoio (security definer, sem recursão de RLS)
create or replace function public.my_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_medica() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'medica', false)
$$;

create or replace function public.has_perm(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when public.is_medica() then true
    when public.my_role() is distinct from 'equipe' then false
    else coalesce((select case p
      when 'manage_patients' then can_manage_patients
      when 'upload_measurements' then can_upload_measurements
      when 'answer_checkins' then can_answer_checkins
      when 'view_clinical' then can_view_clinical
      else false end
      from public.team_permissions where user_id = auth.uid()), false)
  end
$$;

create or replace function public.can_see_patient(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_perm('manage_patients')
    or public.has_perm('view_clinical')
    or exists (select 1 from public.patients where id = pid and user_id = auth.uid() and status = 'ativa')
    or (public.my_role() = 'equipe' and exists (
          select 1 from public.partner_assignments a
          where a.patient_id = pid and a.partner_id = auth.uid()))
$$;

-- Registro de acesso a dado clínico (único caminho de escrita no log)
create or replace function public.log_access(pid uuid, p_resource text, p_action text default 'view')
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not public.can_see_patient(pid) then
    raise exception 'sem acesso';
  end if;
  insert into public.access_logs (actor_id, patient_id, resource, action)
  values (auth.uid(), pid, p_resource, p_action);
end $$;

-- Novo usuário vira perfil de paciente
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  update public.patients set user_id = new.id
   where user_id is null and lower(email) = lower(new.email);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Ninguém além da médica muda papel ou status ativo
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role or new.active is distinct from old.active)
     and auth.uid() is not null and not public.is_medica() then
    raise exception 'apenas a médica altera papel ou acesso';
  end if;
  return new;
end $$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- RLS
alter table public.profiles enable row level security;
alter table public.team_permissions enable row level security;
alter table public.patients enable row level security;
alter table public.partner_assignments enable row level security;
alter table public.programs enable row level security;
alter table public.enrollments enable row level security;
alter table public.consent_terms enable row level security;
alter table public.consents enable row level security;
alter table public.access_logs enable row level security;

create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_medica() or public.has_perm('manage_patients'));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_medica()) with check (id = auth.uid() or public.is_medica());

create policy team_select on public.team_permissions for select to authenticated
  using (user_id = auth.uid() or public.is_medica());
create policy team_write on public.team_permissions for all to authenticated
  using (public.is_medica()) with check (public.is_medica());

create policy patients_select on public.patients for select to authenticated
  using (public.can_see_patient(id));
create policy patients_insert on public.patients for insert to authenticated
  with check (public.has_perm('manage_patients'));
create policy patients_update on public.patients for update to authenticated
  using (public.has_perm('manage_patients')) with check (public.has_perm('manage_patients'));
create policy patients_delete on public.patients for delete to authenticated
  using (public.is_medica());

create policy partners_select on public.partner_assignments for select to authenticated
  using (partner_id = auth.uid() or public.is_medica());
create policy partners_write on public.partner_assignments for all to authenticated
  using (public.is_medica()) with check (public.is_medica());

create policy programs_select on public.programs for select to authenticated using (true);
create policy programs_write on public.programs for all to authenticated
  using (public.is_medica()) with check (public.is_medica());

create policy enroll_select on public.enrollments for select to authenticated
  using (public.can_see_patient(patient_id));
create policy enroll_write on public.enrollments for all to authenticated
  using (public.has_perm('manage_patients')) with check (public.has_perm('manage_patients'));

create policy terms_select on public.consent_terms for select to anon, authenticated
  using (published_at is not null or public.is_medica());
create policy terms_write on public.consent_terms for all to authenticated
  using (public.is_medica()) with check (public.is_medica());

create policy consents_select on public.consents for select to authenticated
  using (user_id = auth.uid() or public.is_medica());
create policy consents_insert on public.consents for insert to authenticated
  with check (user_id = auth.uid());

create policy logs_select on public.access_logs for select to authenticated
  using (public.is_medica());

revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.guard_profile_update() from anon, authenticated, public;
revoke execute on function public.log_access(uuid, text, text) from anon, public;

-- Programas
insert into public.programs (slug, name, duration_months, encounters, price_cents) values
  ('essencial', 'Longevidade Essencial', 6, 3, 390000),
  ('completo', 'Longevidade Completo', 6, 3, 690000),
  ('anual', 'Longevidade Anual', 12, 5, 1190000);
