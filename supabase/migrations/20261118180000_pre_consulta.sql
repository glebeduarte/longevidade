-- Questionário pré-consulta público (/pre-consulta), sem login.
-- Qualquer pessoa preenche; só a médica e quem cadastra pacientes leem.

create table if not exists public.pre_consultas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  nascimento date,
  telefone text not null,
  email text not null,
  respostas jsonb not null default '{}',
  anexos text[] not null default '{}',     -- caminhos no bucket "pre-consulta"
  consentimento boolean not null default false,
  lida_em timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists pre_consultas_data on public.pre_consultas (created_at desc);

alter table public.pre_consultas enable row level security;
drop policy if exists pc_gestao on public.pre_consultas;
create policy pc_gestao on public.pre_consultas for all to authenticated
  using (public.is_medica() or public.has_perm('manage_patients'))
  with check (public.is_medica() or public.has_perm('manage_patients'));

-- Exames anexados: bucket privado. O público só envia (pasta com id aleatório); só a gestão lê.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pre-consulta', 'pre-consulta', false, 15728640,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do nothing;
drop policy if exists pre_consulta_envio on storage.objects;
create policy pre_consulta_envio on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'pre-consulta' and (storage.foldername(name))[1] = 'envios');
drop policy if exists pre_consulta_leitura on storage.objects;
create policy pre_consulta_leitura on storage.objects for select to authenticated
  using (bucket_id = 'pre-consulta' and (public.is_medica() or public.has_perm('manage_patients')));
drop policy if exists pre_consulta_apagar on storage.objects;
create policy pre_consulta_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'pre-consulta' and (public.is_medica() or public.has_perm('manage_patients')));

-- Única porta de entrada pública
create or replace function public.enviar_pre_consulta(
  p_nome text, p_nascimento date, p_telefone text, p_email text,
  p_respostas jsonb, p_anexos text[], p_consentimento boolean
) returns uuid language plpgsql security definer set search_path = public as $$
declare novo uuid; mail text; tel text; medica_email text; recentes int;
begin
  mail := lower(trim(coalesce(p_email, '')));
  tel := left(regexp_replace(coalesce(p_telefone, ''), '[^0-9+]', '', 'g'), 20);
  if length(trim(coalesce(p_nome, ''))) < 3 or length(p_nome) > 150 then raise exception 'informe seu nome completo'; end if;
  if mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(mail) > 200 then raise exception 'e-mail inválido'; end if;
  if length(regexp_replace(tel, '[^0-9]', '', 'g')) < 10 then raise exception 'telefone inválido'; end if;
  if p_nascimento is not null and (p_nascimento > current_date or p_nascimento < date '1900-01-01') then raise exception 'data de nascimento inválida'; end if;
  if not coalesce(p_consentimento, false) then raise exception 'é preciso aceitar o uso dos dados'; end if;
  if pg_column_size(p_respostas) > 60000 or coalesce(array_length(p_anexos, 1), 0) > 10 then raise exception 'envio grande demais'; end if;
  if exists (select 1 from unnest(coalesce(p_anexos, '{}')) a where a !~ '^envios/') then raise exception 'anexo inválido'; end if;
  -- trava contra repetição: até 3 envios por e-mail por hora
  select count(*) into recentes from public.pre_consultas where email = mail and created_at > now() - interval '1 hour';
  if recentes >= 3 then raise exception 'muitos envios'; end if;

  insert into public.pre_consultas (nome, nascimento, telefone, email, respostas, anexos, consentimento)
  values (trim(p_nome), p_nascimento, tel, mail, coalesce(p_respostas, '{}'), coalesce(p_anexos, '{}'), true)
  returning id into novo;

  -- Aviso por WhatsApp (modelo "pre_consulta_recebida" no MasterZap)
  perform public.whatsapp_medica('pre_consulta_recebida',
    jsonb_build_object('paciente', trim(p_nome), 'link', 'https://bartirareboucas.com.br/painel/site?aba=preconsultas'), null);

  -- Aviso por e-mail para a médica
  select email into medica_email from public.profiles where role = 'medica' and active and email is not null order by created_at limit 1;
  if medica_email is not null then
    insert into public.email_outbox (to_email, subject, body, kind)
    values (medica_email, 'Nova pré-consulta: ' || trim(p_nome),
      'Chegou um questionário pré-consulta de <b>' || replace(replace(trim(p_nome), '<', '&lt;'), '>', '&gt;') || '</b>.<br><br>'
      || '<a href="https://bartirareboucas.com.br/painel/site?aba=preconsultas">Ver as respostas no painel</a>', 'pre_consulta');
  end if;
  return novo;
end $$;
revoke execute on function public.enviar_pre_consulta(text, date, text, text, jsonb, text[], boolean) from public;
grant execute on function public.enviar_pre_consulta(text, date, text, text, jsonb, text[], boolean) to anon, authenticated;
