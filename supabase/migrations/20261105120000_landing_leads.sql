-- Landing pages de materiais (guia, e-book) e captura de leads

create table public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titulo text not null,
  tipo text not null default 'E-book',
  chamada text,                -- frase curta acima do título
  subtitulo text,              -- promessa em uma frase
  descricao text,              -- parágrafo da landing
  beneficios jsonb not null default '[]',   -- lista de "o que você vai encontrar"
  botao text not null default 'Quero receber',
  obrigado text not null default 'Pronto! Seu material está liberado abaixo e também foi enviado para o seu e-mail.',
  arquivo_path text,           -- PDF no bucket "materiais"
  capa_path text,              -- imagem de capa no bucket "materiais"
  ativa boolean not null default false,     -- landing no ar
  destaque boolean not null default false,  -- estrela: aparece na página inicial do site
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  landing_id uuid not null references public.landing_pages(id) on delete cascade,
  nome text not null,
  email text not null,
  whatsapp text,
  consentimento boolean not null default false,
  origem jsonb not null default '{}',       -- utm_source, utm_campaign, referrer
  vezes int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (landing_id, email)
);
create index on public.leads (created_at desc);

-- Quem gerencia o site: a médica ou quem pode cadastrar pacientes
create or replace function public.pode_gerir_site() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_medica() or public.has_perm('manage_patients')
$$;
grant execute on function public.pode_gerir_site() to authenticated;

alter table public.landing_pages enable row level security;
alter table public.leads enable row level security;
create policy lp_publico on public.landing_pages for select to anon, authenticated using (ativa or public.pode_gerir_site());
create policy lp_gestao on public.landing_pages for all to authenticated using (public.pode_gerir_site()) with check (public.pode_gerir_site());
create policy ld_gestao on public.leads for all to authenticated using (public.pode_gerir_site()) with check (public.pode_gerir_site());

-- Arquivos dos materiais: leitura pública por link (nomes aleatórios), envio só pela gestão
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('materiais', 'materiais', true, 31457280, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
create policy materiais_gestao_insert on storage.objects for insert to authenticated with check (bucket_id = 'materiais' and public.pode_gerir_site());
create policy materiais_gestao_update on storage.objects for update to authenticated using (bucket_id = 'materiais' and public.pode_gerir_site());
create policy materiais_gestao_delete on storage.objects for delete to authenticated using (bucket_id = 'materiais' and public.pode_gerir_site());

-- Captura: única porta de entrada pública. Valida, grava (ou atualiza) o lead,
-- enfileira o e-mail com o material e devolve o caminho do arquivo.
create or replace function public.capturar_lead(p_slug text, p_nome text, p_email text, p_whatsapp text, p_consentimento boolean, p_origem jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = public as $$
declare lp record; mail text; link text;
begin
  select * into lp from public.landing_pages where slug = p_slug and ativa;
  if lp is null then raise exception 'material indisponível'; end if;
  mail := lower(trim(p_email));
  if mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(mail) > 200 then raise exception 'e-mail inválido'; end if;
  if length(trim(coalesce(p_nome, ''))) < 2 or length(p_nome) > 120 then raise exception 'informe seu nome'; end if;
  if not coalesce(p_consentimento, false) then raise exception 'é preciso aceitar o uso dos dados'; end if;

  insert into public.leads (landing_id, nome, email, whatsapp, consentimento, origem)
  values (lp.id, trim(p_nome), mail, nullif(left(regexp_replace(coalesce(p_whatsapp, ''), '[^0-9+]', '', 'g'), 20), ''), true, coalesce(p_origem, '{}'))
  on conflict (landing_id, email) do update
    set nome = excluded.nome, whatsapp = coalesce(excluded.whatsapp, leads.whatsapp), vezes = leads.vezes + 1, updated_at = now();

  if lp.arquivo_path is not null then
    link := 'https://iabuqhwwpuqfleqmkufz.supabase.co/storage/v1/object/public/materiais/' || lp.arquivo_path;
    insert into public.email_outbox (to_email, subject, body, kind)
    values (mail, 'Seu material: ' || lp.titulo,
      'Olá, ' || split_part(trim(p_nome), ' ', 1) || '!<br><br>Aqui está o seu ' || lower(lp.tipo) || ' <b>' || lp.titulo ||
      '</b>:<br><a href="' || link || '">Baixar o material</a><br><br>Com carinho,<br>Dra. Bartira Rebouças', 'material');
  end if;
  return jsonb_build_object('arquivo', lp.arquivo_path, 'obrigado', lp.obrigado);
end $$;
revoke execute on function public.capturar_lead(text, text, text, text, boolean, jsonb) from public;
grant execute on function public.capturar_lead(text, text, text, text, boolean, jsonb) to anon, authenticated;

-- Os dois materiais atuais (no ar e com estrela; o PDF é enviado pelo painel)
insert into public.landing_pages (slug, titulo, tipo, chamada, subtitulo, descricao, beneficios, botao, ativa, destaque, ordem) values
('mulheres-em-transformacao', 'Mulheres em Transformação', 'Guia', 'Guia gratuito',
 'Os 6 pilares para atravessar o climatério com saúde, energia e clareza.',
 'Um guia prático escrito pela Dra. Bartira Rebouças para quem sente que o corpo mudou e quer entender o que fazer. Sem termos difíceis e sem fórmulas prontas.',
 '["O que muda no corpo da mulher a partir dos 40 anos", "Os 6 pilares do cuidado nessa fase", "Hábitos simples para dormir melhor e ter mais energia", "Quando procurar ajuda médica"]',
 'Quero o guia', true, true, 1),
('climaterio-sem-tabu', 'Climatério sem Tabu', 'E-book', 'E-book gratuito',
 'Respostas claras para as dúvidas mais comuns sobre o climatério e a menopausa.',
 'Calorões, insônia, alterações de humor e de libido ainda são tratados em silêncio. Neste e-book, a Dra. Bartira responde às perguntas que mais ouve no consultório.',
 '["A diferença entre climatério e menopausa", "Os sintomas mais comuns e por que acontecem", "O que se sabe hoje sobre terapia hormonal", "Mitos e verdades sobre essa fase"]',
 'Quero o e-book', true, true, 2)
on conflict (slug) do nothing;
