-- Editor de e-mails avulsos (campanhas) para leads, pacientes ou todos, com o mesmo modelo visual dos e-mails automáticos.

create table if not exists public.campanhas (
  id uuid primary key default gen_random_uuid(),
  assunto text not null default '',
  rotulo text not null default 'Dra. Bartira Rebouças',
  titulo text not null default '',
  texto text not null default '',          -- texto como foi digitado no editor
  corpo text not null default '',          -- HTML gerado a partir do texto
  destaque text,
  botao_texto text,
  botao_link text,
  previa text,
  publico text not null default 'leads' check (publico in ('leads', 'pacientes', 'todos')),
  landing_id uuid references public.landing_pages(id) on delete set null,  -- filtro opcional de leads por material
  status text not null default 'rascunho' check (status in ('rascunho', 'enviada')),
  total int,
  enviada_em timestamptz,
  criado_por uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.campanhas enable row level security;
create policy cp_gestao on public.campanhas for all to authenticated using (public.pode_gerir_site()) with check (public.pode_gerir_site());

-- Quem pediu para não receber e-mails avulsos (leads e pacientes)
create table if not exists public.email_descadastros (email text primary key, created_at timestamptz not null default now());
alter table public.email_descadastros enable row level security;
create policy ed_gestao on public.email_descadastros for select to authenticated using (public.pode_gerir_site());

alter table public.email_outbox add column if not exists campanha_id uuid references public.campanhas(id) on delete set null;
alter table public.email_outbox add column if not exists rotulo text;
alter table public.email_outbox add column if not exists titulo text;
alter table public.email_outbox add column if not exists botao text;
create index if not exists email_outbox_campanha on public.email_outbox (campanha_id);

create policy eo_campanha on public.email_outbox for select to authenticated using (campanha_id is not null and public.pode_gerir_site());

-- Destinatários de um público, sem duplicar e-mail. Paciente tem prioridade sobre lead com o mesmo e-mail.
create or replace function public.destinatarios_campanha(p_publico text, p_landing uuid default null)
returns table (email text, nome text, tipo text, lead_id uuid, token uuid)
language sql stable security definer set search_path = public as $$
  with p as (
    select lower(trim(email)) email, name nome, 'paciente'::text tipo, null::uuid lead_id, null::uuid token
    from public.patients
    where p_publico in ('pacientes', 'todos') and status = 'ativa' and email is not null and email not like '%@teste.longevidade'
  ), l as (
    select distinct on (lower(l.email)) lower(l.email) email, l.nome, 'lead'::text, l.id, l.token
    from public.leads l
    where p_publico in ('leads', 'todos') and l.consentimento and l.descadastrado_at is null
      and (p_landing is null or l.landing_id = p_landing) and l.email not like '%@teste.longevidade'
    order by lower(l.email), l.created_at desc
  )
  select * from (
    select * from p
    union all
    select * from l where l.email not in (select email from p)
  ) t
  where t.email not in (select email from public.email_descadastros)
$$;
revoke execute on function public.destinatarios_campanha(text, uuid) from public, anon, authenticated;

create or replace function public.contar_destinatarios(p_publico text, p_landing uuid default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.pode_gerir_site() then raise exception 'sem permissão'; end if;
  return (select jsonb_build_object('total', count(*), 'pacientes', count(*) filter (where tipo = 'paciente'), 'leads', count(*) filter (where tipo = 'lead'))
          from public.destinatarios_campanha(p_publico, p_landing));
end $$;
revoke execute on function public.contar_destinatarios(text, uuid) from public, anon;
grant execute on function public.contar_destinatarios(text, uuid) to authenticated;

create or replace function public.primeiro_nome(n text) returns text
language sql immutable as $$ select replace(replace(split_part(trim(coalesce(n, '')), ' ', 1), '<', ''), '>', '') $$;

-- Coloca a campanha na fila: um e-mail por destinatário, com {nome} trocado pelo primeiro nome.
create or replace function public.disparar_campanha(p_id uuid) returns int
language plpgsql security definer set search_path = public, privado as $$
declare c record; n int; base text;
begin
  if not public.pode_gerir_site() then raise exception 'sem permissão'; end if;
  select * into c from public.campanhas where id = p_id for update;
  if c is null then raise exception 'campanha não encontrada'; end if;
  if c.status = 'enviada' then raise exception 'esta campanha já foi enviada'; end if;
  if trim(c.assunto) = '' or trim(c.corpo) = '' then raise exception 'preencha o assunto e o texto'; end if;
  select valor into base from privado.config where chave = 'site_url';

  insert into public.email_outbox (to_email, subject, body, kind, campanha_id, rotulo, titulo, botao, link, destaque, lead_id, sair_token)
  select d.email,
    replace(c.assunto, '{nome}', public.primeiro_nome(d.nome)),
    replace(c.corpo, '{nome}', public.primeiro_nome(d.nome)),
    case when d.tipo = 'paciente' then 'campanha_paciente' else 'campanha' end,
    c.id, c.rotulo, replace(coalesce(nullif(trim(c.titulo), ''), c.assunto), '{nome}', public.primeiro_nome(d.nome)),
    c.botao_texto,
    case when c.botao_link is null or trim(c.botao_link) = '' then null when c.botao_link like 'http%' then c.botao_link else base || c.botao_link end,
    case when c.destaque is null then null else replace(c.destaque, '{nome}', public.primeiro_nome(d.nome)) end,
    d.lead_id, coalesce(d.token, gen_random_uuid())
  from public.destinatarios_campanha(c.publico, c.landing_id) d;
  get diagnostics n = row_count;

  update public.campanhas set status = 'enviada', enviada_em = now(), total = n, updated_at = now() where id = p_id;
  return n;
end $$;
revoke execute on function public.disparar_campanha(uuid) from public, anon;
grant execute on function public.disparar_campanha(uuid) to authenticated;

-- E-mail de teste para quem está editando
create or replace function public.testar_campanha(p_id uuid) returns text
language plpgsql security definer set search_path = public, privado as $$
declare c record; mail text; nome text; base text;
begin
  if not public.pode_gerir_site() then raise exception 'sem permissão'; end if;
  select * into c from public.campanhas where id = p_id;
  if c is null then raise exception 'campanha não encontrada'; end if;
  select u.email into mail from auth.users u where u.id = auth.uid();
  select full_name into nome from public.profiles where id = auth.uid();
  select valor into base from privado.config where chave = 'site_url';
  insert into public.email_outbox (to_email, subject, body, kind, rotulo, titulo, botao, link, destaque)
  values (mail, '[Teste] ' || replace(c.assunto, '{nome}', public.primeiro_nome(nome)), replace(c.corpo, '{nome}', public.primeiro_nome(nome)), 'campanha_teste',
    c.rotulo, replace(coalesce(nullif(trim(c.titulo), ''), c.assunto), '{nome}', public.primeiro_nome(nome)), c.botao_texto,
    case when c.botao_link is null or trim(c.botao_link) = '' then null when c.botao_link like 'http%' then c.botao_link else base || c.botao_link end,
    case when c.destaque is null then null else replace(c.destaque, '{nome}', public.primeiro_nome(nome)) end);
  return mail;
end $$;
revoke execute on function public.testar_campanha(uuid) from public, anon;
grant execute on function public.testar_campanha(uuid) to authenticated;

-- Resultado do envio de cada campanha
create or replace function public.resumo_campanhas() returns table (campanha_id uuid, enviados int, pendentes int, erros int)
language sql stable security definer set search_path = public as $$
  select campanha_id, count(*) filter (where sent_at is not null and error is null)::int,
         count(*) filter (where sent_at is null and error is null)::int, count(*) filter (where sent_at is null and error is not null)::int
  from public.email_outbox where campanha_id is not null and public.pode_gerir_site() group by campanha_id
$$;
grant execute on function public.resumo_campanhas() to authenticated;

-- Descadastro: o lead sai da sequência e de qualquer campanha; paciente sai só das campanhas
create or replace function public.descadastrar_lead(t text) returns boolean
language plpgsql security definer set search_path = public as $$
declare mail text;
begin
  update public.leads set descadastrado_at = coalesce(descadastrado_at, now()) where token::text = t returning email into mail;
  if mail is null then select to_email into mail from public.email_outbox where sair_token::text = t limit 1; end if;
  if mail is null then return false; end if;
  insert into public.email_descadastros (email) values (lower(mail)) on conflict do nothing;
  update public.email_outbox set sent_at = now(), error = 'descadastrado'
    where sent_at is null and (sair_token::text = t or (lower(to_email) = lower(mail) and kind in ('campanha', 'campanha_paciente', 'sequencia')));
  return true;
end $$;
revoke execute on function public.descadastrar_lead(text) from public, anon, authenticated;
grant execute on function public.descadastrar_lead(text) to service_role;
