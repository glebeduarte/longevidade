-- Reenvio de questionários pendentes: um, vários ou todos, num único e-mail para a paciente.
alter table public.questionnaire_assignments add column if not exists reenviado_at timestamptz;
alter table public.questionnaire_assignments add column if not exists reenvios int not null default 0;

create or replace function public.reenviar_questionarios(p_ids uuid[]) returns int
language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  if not (public.is_medica() or public.has_perm('manage_patients')) then raise exception 'sem permissão'; end if;
  for r in
    select a.patient_id, string_agg('<li>' || q.name || '</li>', '' order by q.sort) lista, count(*) qtd, array_agg(a.id) ids
    from public.questionnaire_assignments a join public.questionnaires q on q.id = a.questionnaire_id
    where a.id = any(p_ids) and a.status = 'pendente'
    group by a.patient_id
  loop
    insert into public.email_outbox (to_email, subject, body, kind, patient_id, destaque)
    select email,
      case when r.qtd = 1 then 'Lembrete: um questionário espera por você' else 'Lembrete: ' || r.qtd || ' questionários esperam por você' end,
      'A Dra. Bartira pediu que você responda ' || case when r.qtd = 1 then 'este questionário' else 'estes questionários' end ||
      ' antes do próximo encontro. Cada um leva poucos minutos.<br><br>No app, toque em Questionários, na tela inicial.',
      'questionario', id, '<ul style="margin:0;padding-left:18px">' || r.lista || '</ul>'
    from public.patients where id = r.patient_id and status = 'ativa' and email not like '%@teste.longevidade';
    update public.questionnaire_assignments set reenviado_at = now(), reenvios = reenvios + 1 where id = any(r.ids);
    n := n + r.qtd;
  end loop;
  return n;
end $$;
revoke execute on function public.reenviar_questionarios(uuid[]) from public, anon;
grant execute on function public.reenviar_questionarios(uuid[]) to authenticated;
