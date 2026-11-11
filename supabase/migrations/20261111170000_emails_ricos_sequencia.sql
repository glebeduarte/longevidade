-- E-mails com modelo visual por tipo e sequência de relacionamento para quem baixa os e-books.

alter table public.email_outbox add column if not exists link text;
alter table public.email_outbox add column if not exists destaque text;
alter table public.email_outbox add column if not exists lead_id uuid references public.leads(id) on delete cascade;
alter table public.email_outbox add column if not exists sair_token uuid;

alter table public.leads add column if not exists token uuid not null default gen_random_uuid();
alter table public.leads add column if not exists descadastrado_at timestamptz;

insert into privado.config values ('site_url', 'https://longevidade-black.vercel.app') on conflict (chave) do nothing;

-- Passos da sequência. landing_id nulo vale para todos os materiais.
create table if not exists public.sequencia_passos (
  id uuid primary key default gen_random_uuid(),
  landing_id uuid references public.landing_pages(id) on delete cascade,
  dia int not null check (dia > 0),
  assunto text not null,
  corpo text not null,          -- parágrafos separados por <br><br>
  destaque text,
  link text,                    -- caminho no site (ex.: /contato) ou URL completa
  ativo boolean not null default true,
  ordem int not null default 0
);
create table if not exists public.sequencia_envios (
  lead_id uuid not null references public.leads(id) on delete cascade,
  passo_id uuid not null references public.sequencia_passos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (lead_id, passo_id)
);
alter table public.sequencia_passos enable row level security;
alter table public.sequencia_envios enable row level security;
create policy sp_gestao on public.sequencia_passos for all to authenticated using (public.pode_gerir_site()) with check (public.pode_gerir_site());
create policy se_gestao on public.sequencia_envios for select to authenticated using (public.pode_gerir_site());

-- Enfileira os passos vencidos, só entre 8h e 20h de Natal, um passo por contato por vez
create or replace function public.enfileirar_sequencia() returns int
language plpgsql security definer set search_path = public, privado as $$
declare n int := 0; r record; base text;
begin
  if extract(hour from now() at time zone 'America/Fortaleza') not between 8 and 19 then return 0; end if;
  select valor into base from privado.config where chave = 'site_url';
  for r in
    select distinct on (l.id) l.id lead_id, l.email, l.nome, l.token, p.*
    from public.leads l
    join public.sequencia_passos p on p.ativo and (p.landing_id is null or p.landing_id = l.landing_id)
    where l.consentimento and l.descadastrado_at is null
      and l.created_at + make_interval(days => p.dia) <= now()
      and not exists (select 1 from public.sequencia_envios s where s.lead_id = l.id and s.passo_id = p.id)
      and not exists (select 1 from public.sequencia_envios s2 join public.sequencia_passos p2 on p2.id = s2.passo_id
                      where s2.lead_id = l.id and s2.passo_id <> p.id and p2.landing_id is not distinct from p.landing_id
                        and s2.created_at > now() - interval '20 hours')
      and l.email not like '%@teste.longevidade'
    order by l.id, p.dia
  loop
    insert into public.sequencia_envios (lead_id, passo_id) values (r.lead_id, r.id);
    insert into public.email_outbox (to_email, subject, body, kind, destaque, link, lead_id, sair_token)
    values (r.email, r.assunto,
      replace(r.corpo, '{nome}', replace(replace(split_part(trim(r.nome), ' ', 1), '<', ''), '>', '')),
      'sequencia', r.destaque,
      case when r.link is null then null when r.link like 'http%' then r.link else base || r.link end,
      r.lead_id, r.token);
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public.enfileirar_sequencia() from public, anon, authenticated;

create or replace function public.descadastrar_lead(t text) returns boolean
language plpgsql security definer set search_path = public as $$
declare k int;
begin
  update public.leads set descadastrado_at = coalesce(descadastrado_at, now()) where token::text = t;
  get diagnostics k = row_count;
  update public.email_outbox set sent_at = now(), error = 'descadastrado' where sair_token::text = t and sent_at is null;
  return k > 0;
end $$;
revoke execute on function public.descadastrar_lead(text) from public, anon, authenticated;
grant execute on function public.descadastrar_lead(text) to service_role;

-- Material: link no botão, sem âncora no texto
create or replace function public.capturar_lead(p_slug text, p_nome text, p_email text, p_whatsapp text, p_consentimento boolean, p_origem jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = public as $$
declare lp record; mail text; lid uuid; tok uuid;
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
    set nome = excluded.nome, whatsapp = coalesce(excluded.whatsapp, leads.whatsapp), vezes = leads.vezes + 1, updated_at = now(), descadastrado_at = null
  returning id, token into lid, tok;

  if lp.arquivo_path is not null then
    insert into public.email_outbox (to_email, subject, body, kind, link, lead_id, sair_token)
    values (mail, 'Seu ' || lower(lp.tipo) || ': ' || lp.titulo,
      'Olá, ' || replace(replace(split_part(trim(p_nome), ' ', 1), '<', ''), '>', '') || '!<br><br>Obrigada pelo interesse. O seu ' || lower(lp.tipo) || ' <b>' || lp.titulo ||
      '</b> está liberado no botão abaixo.<br><br>Leia com calma e no seu tempo. Nos próximos dias eu envio alguns e-mails curtos com pontos que costumam gerar dúvida no consultório.<br><br>Um abraço,<br>Dra. Bartira Rebouças',
      'material', 'https://iabuqhwwpuqfleqmkufz.supabase.co/storage/v1/object/public/materiais/' || lp.arquivo_path, lid, tok);
  end if;
  return jsonb_build_object('arquivo', lp.arquivo_path, 'obrigado', lp.obrigado);
end $$;
revoke execute on function public.capturar_lead(text, text, text, text, boolean, jsonb) from public;
grant execute on function public.capturar_lead(text, text, text, text, boolean, jsonb) to anon, authenticated;

-- Aviso de contato novo com os dados em destaque
create or replace function public.avisar_lead() returns trigger
language plpgsql security definer set search_path = public, privado as $$
declare t text;
begin
  select titulo into t from public.landing_pages where id = new.landing_id;
  insert into public.email_outbox (to_email, subject, body, kind, destaque)
  select valor, 'Novo contato pelo site', 'Uma pessoa pediu o material <b>' || t || '</b> no site e entrou na sequência de e-mails.', 'lead',
    '<b>' || replace(replace(new.nome, '<', '&lt;'), '>', '&gt;') || '</b><br>' || new.email || coalesce('<br>WhatsApp: ' || new.whatsapp, '')
    || coalesce('<br>Origem: ' || nullif(new.origem ->> 'utm_source', ''), '')
  from privado.config where chave = 'email_equipe';
  return new;
end $$;

-- Resposta ao check-in no quadro de destaque
create or replace function public.notificar() returns trigger
language plpgsql security definer set search_path = public as $$
declare nome text;
begin
  if tg_table_name = 'questionnaire_assignments' then
    if new.assigned_by is not null then
      select name into nome from public.questionnaires where id = new.questionnaire_id;
      perform public.email_paciente(new.patient_id, 'questionario', 'Novo questionário para responder',
        'A Dra. Bartira enviou o questionário <b>' || nome || '</b>.<br><br>Leva poucos minutos e deixa o seu encontro mais focado no que importa para você.');
    end if;
  elsif tg_table_name = 'health_maps' then
    if new.status = 'finalizado' and old.status is distinct from 'finalizado' then
      perform public.email_paciente(new.patient_id, 'mapa', 'Seu Mapa da Saúde está pronto',
        'A Dra. Bartira revisou o seu Mapa da Saúde.<br><br>Ele mostra cada área avaliada e o que merece mais atenção agora. Está disponível em Minha evolução, no app.');
    end if;
  elsif tg_table_name = 'checkins' then
    if new.reply is not null and new.reply is distinct from old.reply then
      insert into public.email_outbox (to_email, subject, body, kind, patient_id, destaque)
      select email, 'Resposta ao seu check-in', 'A equipe da Dra. Bartira leu o seu check-in e respondeu:', 'checkin_resposta', id,
        '<i>' || replace(replace(replace(new.reply, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</i>'
      from public.patients where id = new.patient_id and status = 'ativa' and email not like '%@teste.longevidade';
    end if;
  elsif tg_table_name = 'protocols' then
    if new.published_at is not null and (tg_op = 'INSERT' or old.published_at is null) then
      perform public.email_paciente(new.patient_id, 'protocolo', 'Seu plano de cuidado foi atualizado',
        'A Dra. Bartira publicou a versão ' || new.version || ' do seu plano de cuidado.<br><br>Lá estão os medicamentos, os hábitos combinados e os próximos exames, com o porquê de cada escolha.');
    end if;
  end if;
  return new;
end $$;

-- Sequência dos e-books (vale para os dois materiais). Textos para revisão da Dra. Bartira.
insert into public.sequencia_passos (dia, ordem, assunto, corpo, destaque, link) values
(2, 1, 'Por onde começar a leitura',
 'Olá, {nome}.<br><br>Muita gente baixa um material e deixa para depois. Se for o seu caso, uma sugestão: comece pelo capítulo que fala do sintoma que mais incomoda você hoje. É ali que a leitura costuma fazer mais sentido.<br><br>Enquanto lê, anote as dúvidas que aparecerem. Elas ajudam muito numa consulta, porque mostram o que é prioridade para você.',
 'Cada mulher atravessa o climatério de um jeito. O material traz o que é comum, e a avaliação individual mostra o que vale para o seu caso.', null),
(5, 2, 'Por que o sono piora nessa fase',
 'Olá, {nome}.<br><br>Dormir mal é uma das queixas que mais escuto no consultório. No climatério, os calorões noturnos acordam a mulher várias vezes, a ansiedade aumenta e a apneia do sono fica mais frequente.<br><br>Noites ruins também mexem com o apetite, com a glicose e com a recuperação muscular. Por isso o sono entra em toda avaliação que eu faço.',
 '<b>Três cuidados que ajudam:</b><br>Horário regular para deitar e acordar.<br>Quarto fresco e escuro.<br>Cafeína só até o início da tarde.', '/temas/sono'),
(9, 3, 'O peso mudou de lugar',
 'Olá, {nome}.<br><br>Muitas mulheres percebem que, mesmo comendo igual, a gordura passa a se concentrar na barriga. Isso tem relação com a queda do estrogênio e merece atenção, porque a gordura abdominal está ligada a mais risco de diabetes e de doença do coração.<br><br>No consultório, eu acompanho a cintura e a composição corporal por bioimpedância, além do peso. A balança sozinha não mostra quanto é músculo e quanto é gordura.',
 'Treino de força, proteína adequada e sono são a base. Medicamentos entram quando há indicação.', '/temas/peso-e-metabolismo'),
(14, 4, 'Terapia hormonal: o que a ciência mostra hoje',
 'Olá, {nome}.<br><br>A terapia hormonal é o tratamento mais eficaz para os calorões e também ajuda no sono e na proteção dos ossos. Ela não é indicada para todas as mulheres.<br><br>Antes de qualquer prescrição, eu avalio o histórico pessoal e familiar, o risco de trombose, o risco cardiovascular e o de câncer de mama. A decisão é tomada junto com a paciente, com cada risco explicado.',
 'Para quem não pode ou não quer usar hormônios, existem outras opções de tratamento.', '/temas/terapia-hormonal'),
(21, 5, 'Como funciona a consulta',
 'Olá, {nome}.<br><br>Se você está pensando em uma avaliação, conto como ela funciona. Depois do agendamento, a equipe envia um questionário e o pedido de exames. Assim o encontro já começa com os resultados em mãos, e não existe consulta de retorno.<br><br>Atendo na Clínica Equilibre e no Instituto Espinel, em Natal, e também por teleconsulta. Não atendo planos de saúde e emito nota fiscal para reembolso.',
 'Este é o último e-mail desta série. Obrigada por ter lido até aqui.', '/contato');

-- Contatos antigos não recebem a série de uma vez
insert into public.sequencia_envios (lead_id, passo_id)
select l.id, p.id from public.leads l cross join public.sequencia_passos p
where l.created_at + make_interval(days => p.dia) <= now()
on conflict do nothing;
