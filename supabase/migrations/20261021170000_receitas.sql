-- Receitas (PDF original da Memed) ligadas às condutas, com download para a paciente só dentro da validade

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  file_path text not null,
  numero text,
  tipo text not null default 'simples' check (tipo in ('simples', 'retencao', 'controle_especial', 'antimicrobiano')),
  emitida_em date not null,
  valida_ate date not null,
  uso_continuo boolean not null default false,
  token text,
  codigo text,
  itens jsonb not null default '[]',
  orientacoes text,
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index on public.prescriptions (patient_id, valida_ate desc);
alter table public.prescriptions enable row level security;
create policy rx_equipe on public.prescriptions for all to authenticated
  using (public.has_perm('view_clinical')) with check (public.has_perm('view_clinical'));
create policy rx_paciente on public.prescriptions for select to authenticated
  using (active and public.is_my_patient(patient_id));

alter table public.conducts add column if not exists prescription_id uuid references public.prescriptions(id) on delete set null;

-- Arquivos em bucket próprio: a paciente nunca lê direto, só por link temporário gerado pela função "receita"
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receitas', 'receitas', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;
create policy receitas_equipe_select on storage.objects for select to authenticated
  using (bucket_id = 'receitas' and public.has_perm('view_clinical'));
create policy receitas_equipe_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'receitas' and public.has_perm('view_clinical'));
