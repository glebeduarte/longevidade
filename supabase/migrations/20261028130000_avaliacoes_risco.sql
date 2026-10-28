-- Módulos de risco da ficha: PREVENT, FRAX (ajustes ABRASSO), TEV, preensão e cálcio
create table public.risk_assessments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  kind text not null check (kind in ('prevent', 'frax', 'tev', 'preensao', 'calcio')),
  inputs jsonb not null default '{}',
  result jsonb not null default '{}',
  resumo text,
  nivel public.nivel_faixa,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index on public.risk_assessments (patient_id, kind, created_at desc);
alter table public.risk_assessments enable row level security;
create policy ra_all on public.risk_assessments for all to authenticated
  using (public.has_perm('view_clinical')) with check (public.has_perm('view_clinical'));
