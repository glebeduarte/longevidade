-- Avisos por WhatsApp para a paciente: medicações, receitas e plano e combinados.
-- Sem nome de remédio na mensagem. Várias mudanças seguidas (2 minutos) viram um aviso só.

create or replace function public.whatsapp_paciente_agrupado(pid uuid, p_event text, p_vars jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.whatsapp_outbox where patient_id = pid and event = p_event
      and sent_at is null and tentativas = 0 and created_at > now() - interval '2 minutes') then
    return;
  end if;
  perform public.whatsapp_paciente(pid, p_event, p_vars);
end $$;
revoke execute on function public.whatsapp_paciente_agrupado(uuid, text, jsonb) from public, anon, authenticated;

-- Medicações e plano e combinados (tabela conducts)
create or replace function public.whatsapp_conduta() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.title is not distinct from old.title and new.detail is not distinct from old.detail
     and new.active is not distinct from old.active then
    return new;
  end if;
  if new.kind::text = 'medicacao' then
    perform public.whatsapp_paciente_agrupado(new.patient_id, 'medicacao_atualizada',
      jsonb_build_object('nome', public.primeiro_nome(new.patient_id), 'link', 'https://bartirareboucas.com.br/app/protocolo'));
  else
    perform public.whatsapp_paciente_agrupado(new.patient_id, 'plano_atualizado',
      jsonb_build_object('nome', public.primeiro_nome(new.patient_id), 'link', 'https://bartirareboucas.com.br/app/protocolo'));
  end if;
  return new;
end $$;
drop trigger if exists whatsapp_conduta on public.conducts;
create trigger whatsapp_conduta after insert or update on public.conducts
  for each row execute function public.whatsapp_conduta();

-- Receitas novas ou atualizadas (tabela prescriptions)
create or replace function public.whatsapp_receita() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and (not new.active or (new.file_path is not distinct from old.file_path
      and new.valida_ate is not distinct from old.valida_ate and new.itens is not distinct from old.itens
      and new.orientacoes is not distinct from old.orientacoes)) then
    return new;
  end if;
  if tg_op = 'INSERT' and not new.active then return new; end if;
  perform public.whatsapp_paciente_agrupado(new.patient_id, 'receita_atualizada',
    jsonb_build_object('nome', public.primeiro_nome(new.patient_id),
      'acao', case when tg_op = 'INSERT' then 'enviou uma nova receita' else 'atualizou a sua receita' end,
      'link', 'https://bartirareboucas.com.br/app/protocolo'));
  return new;
end $$;
drop trigger if exists whatsapp_receita on public.prescriptions;
create trigger whatsapp_receita after insert or update on public.prescriptions
  for each row execute function public.whatsapp_receita();

revoke execute on function public.whatsapp_conduta(), public.whatsapp_receita() from public, anon, authenticated;
