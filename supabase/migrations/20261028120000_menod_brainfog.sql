-- Meno-D e queixas cognitivas (material da Dra. Bartira, 28/10/2026)

alter table public.questions add column if not exists alert_kind public.tipo_alerta;
alter table public.questions add column if not exists alert_message text;
alter table public.questionnaire_responses add column if not exists alert_kind public.tipo_alerta;
alter table public.questionnaire_responses add column if not exists alert_message text;
alter table public.questionnaires add column if not exists source text;

create or replace function public.score_response() returns trigger
language plpgsql security definer set search_path = public as $$
declare q record; v numeric; total numeric := 0; has_score boolean; b record; qs text; cog boolean := false;
begin
  select scored, slug into has_score, qs from public.questionnaires where id = new.questionnaire_id;
  for q in select * from public.questions where questionnaire_id = new.questionnaire_id order by position loop
    v := nullif(new.answers ->> q.id::text, '')::numeric;
    if v is not null and q.scored then total := total + v; end if;
    if v is not null and q.alert_if_gt is not null and v > q.alert_if_gt then
      new.flagged := true;
      if new.alert_message is null then
        new.alert_kind := coalesce(q.alert_kind, 'ideacao');
        new.alert_message := q.alert_message;
      end if;
      if q.alert_kind = 'cognitivo' then cog := true; end if;
    end if;
  end loop;
  if has_score then
    new.score := round(total, 2);
    select label, level into b from public.scoring_bands
      where questionnaire_id = new.questionnaire_id and total between min_score and max_score order by min_score limit 1;
    new.band_label := b.label; new.band_level := b.level;
  end if;
  if qs = 'brainfog' then
    if cog then new.band_label := 'Alerta para avaliação cognitiva'; new.band_level := 'atencao';
    else new.band_label := 'Sem sinais de alerta na triagem'; new.band_level := null; end if;
  end if;
  return new;
end $$;

create or replace function public.after_response() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.questionnaire_assignments set status = 'respondido' where id = new.assignment_id;
  if new.flagged then
    insert into public.clinical_alerts (patient_id, kind, source_response_id, message)
    values (new.patient_id, coalesce(new.alert_kind, 'ideacao'), new.id,
      coalesce(new.alert_message, 'Resposta positiva no item 9 do PHQ-9 (pensamentos de morte ou de se machucar). Avaliar hoje.'));
  end if;
  return new;
end $$;

insert into public.questionnaires (slug, name, domain, instructions, scored, sort, source) values
 ('menod', 'Meno-D', 'Humor', 'Pense nas últimas 2 semanas. Em cada tema, escolha a opção que mais combina com você.', true, 2,
  'Kulkarni et al., 2018 (PMC6023883). Soma de 0 a 48, sem pontos de corte validados: acompanhar total, itens e evolução.'),
 ('brainfog', 'Brain Fog', 'Cognição', 'Responda sim ou não. Não existe resposta certa: isso ajuda a Dra. Bartira a entender suas queixas.', false, 12,
  'British Menopause Society, 2026. Triagem clínica sem pontuação; não faz diagnóstico.')
on conflict (slug) do nothing;

insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 1, 'Energia', 'escolha', '[{"label": "Sem alteração", "value": 0}, {"label": "Cansaço depois de atividades", "value": 1}, {"label": "Reduzo atividades por fadiga", "value": 2}, {"label": "Fadiga mesmo depois de descansar", "value": 3}, {"label": "Exaustão até em tarefas simples", "value": 4}]'::jsonb, true, null, null, null from public.questionnaires where slug = 'menod' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 2, 'Pensamentos de desvalorização ou desconfiança', 'escolha', '[{"label": "Ausentes", "value": 0}, {"label": "Me preocupo com o julgamento dos outros", "value": 1}, {"label": "Desconfio de críticas em casa ou no trabalho", "value": 2}, {"label": "Tenho certeza de que os outros me desvalorizam", "value": 3}, {"label": "Tenho certeza de que querem me prejudicar", "value": 4}]'::jsonb, true, null, null, null from public.questionnaires where slug = 'menod' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 3, 'Irritabilidade', 'escolha', '[{"label": "Ausente", "value": 0}, {"label": "Leve", "value": 1}, {"label": "Reajo demais a pequenas coisas", "value": 2}, {"label": "Tenho explosões verbais", "value": 3}, {"label": "Raiva intensa e explosões importantes", "value": 4}]'::jsonb, true, null, null, null from public.questionnaires where slug = 'menod' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 4, 'Autoestima', 'escolha', '[{"label": "Preservada", "value": 0}, {"label": "Caiu um pouco", "value": 1}, {"label": "Me avalio de forma negativa sem motivo real", "value": 2}, {"label": "Me critico e me diminuo muito", "value": 3}, {"label": "Sentimento extremo de não ter valor", "value": 4}]'::jsonb, true, 3, 'ideacao', 'Meno-D: autoestima com pontuação máxima (sentimento extremo de desvalor). Avaliar risco de autoagressão hoje.' from public.questionnaires where slug = 'menod' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 5, 'Convívio social', 'escolha', '[{"label": "Socializo como de costume", "value": 0}, {"label": "Socializo menos", "value": 1}, {"label": "Perdi o interesse em encontrar pessoas", "value": 2}, {"label": "Me afastei de pessoas e do trabalho", "value": 3}, {"label": "Me sinto isolada mesmo acompanhada", "value": 4}]'::jsonb, true, null, null, null from public.questionnaires where slug = 'menod' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 6, 'Ansiedade', 'escolha', '[{"label": "Ausente", "value": 0}, {"label": "Ao me expor em público", "value": 1}, {"label": "Em tarefas novas", "value": 2}, {"label": "Em tarefas da rotina", "value": 3}, {"label": "Pânico em atividades habituais", "value": 4}]'::jsonb, true, null, null, null from public.questionnaires where slug = 'menod' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 7, 'Dores no corpo', 'escolha', '[{"label": "Ausentes", "value": 0}, {"label": "Dores ao fazer exercício", "value": 1}, {"label": "Dores com pequenos esforços", "value": 2}, {"label": "Dores frequentes que limitam minhas atividades", "value": 3}, {"label": "Dores que me incapacitam", "value": 4}]'::jsonb, true, null, null, null from public.questionnaires where slug = 'menod' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 8, 'Sono', 'escolha', '[{"label": "Normal", "value": 0}, {"label": "Acordo pouco e volto a dormir fácil", "value": 1}, {"label": "Acordo várias vezes e volto a dormir fácil", "value": 2}, {"label": "Acordo com calorões e custo a voltar a dormir", "value": 3}, {"label": "Durmo muito pouco por sintomas à noite", "value": 4}]'::jsonb, true, null, null, null from public.questionnaires where slug = 'menod' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 9, 'Peso', 'escolha', '[{"label": "Sem alteração", "value": 0}, {"label": "Ganhei 1 a 2 kg", "value": 1}, {"label": "Ganhei 3 a 6 kg sem mudar hábitos", "value": 2}, {"label": "Continuo ganhando e acumulando na barriga apesar dos cuidados", "value": 3}, {"label": "Ganhei mais de 6 kg e mudou onde acumulo gordura", "value": 4}]'::jsonb, true, null, null, null from public.questionnaires where slug = 'menod' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 10, 'Interesse sexual', 'escolha', '[{"label": "Sem alteração", "value": 0}, {"label": "Diminuiu um pouco", "value": 1}, {"label": "Diminuiu bastante", "value": 2}, {"label": "Diminuiu e tenho desconforto na relação", "value": 3}, {"label": "Sem interesse", "value": 4}]'::jsonb, true, null, null, null from public.questionnaires where slug = 'menod' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 11, 'Memória', 'escolha', '[{"label": "Sem alteração", "value": 0}, {"label": "Esqueço nomes e números", "value": 1}, {"label": "Preciso de listas para dar conta", "value": 2}, {"label": "Esquecimentos que atrapalham o dia a dia", "value": 3}, {"label": "Perda grave que me impede de fazer as coisas", "value": 4}]'::jsonb, true, null, null, null from public.questionnaires where slug = 'menod' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 12, 'Concentração', 'escolha', '[{"label": "Normal", "value": 0}, {"label": "Leve dificuldade para ler", "value": 1}, {"label": "Dificuldade para ler e ver TV", "value": 2}, {"label": "Dificuldade acentuada", "value": 3}, {"label": "Não consigo manter o foco", "value": 4}]'::jsonb, true, null, null, null from public.questionnaires where slug = 'menod' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 1, 'As falhas de memória ou concentração começaram na transição da menopausa?', 'escolha', '[{"label": "Sim", "value": 1}, {"label": "Não", "value": 0}]'::jsonb, false, null, null, null from public.questionnaires where slug = 'brainfog' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 2, 'Elas variam de um dia para o outro?', 'escolha', '[{"label": "Sim", "value": 1}, {"label": "Não", "value": 0}]'::jsonb, false, null, null, null from public.questionnaires where slug = 'brainfog' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 3, 'Você tem dificuldade para encontrar palavras?', 'escolha', '[{"label": "Sim", "value": 1}, {"label": "Não", "value": 0}]'::jsonb, false, null, null, null from public.questionnaires where slug = 'brainfog' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 4, 'Você tem dificuldade de concentração?', 'escolha', '[{"label": "Sim", "value": 1}, {"label": "Não", "value": 0}]'::jsonb, false, null, null, null from public.questionnaires where slug = 'brainfog' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 5, 'Você tem alterações de sono, humor ou calorões?', 'escolha', '[{"label": "Sim", "value": 1}, {"label": "Não", "value": 0}]'::jsonb, false, null, null, null from public.questionnaires where slug = 'brainfog' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 6, 'As falhas estão piorando com o tempo?', 'escolha', '[{"label": "Sim", "value": 1}, {"label": "Não", "value": 0}]'::jsonb, false, 0, 'cognitivo', 'Triagem cognitiva: falhas progressivas. Considerar avaliação cognitiva.' from public.questionnaires where slug = 'brainfog' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 7, 'Familiares ou pessoas próximas percebem piora?', 'escolha', '[{"label": "Sim", "value": 1}, {"label": "Não", "value": 0}]'::jsonb, false, 0, 'cognitivo', 'Triagem cognitiva: piora percebida por familiares. Considerar avaliação cognitiva.' from public.questionnaires where slug = 'brainfog' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 8, 'Você perdeu autonomia para cuidar das finanças, dos remédios ou de tarefas do dia a dia?', 'escolha', '[{"label": "Sim", "value": 1}, {"label": "Não", "value": 0}]'::jsonb, false, 0, 'cognitivo', 'Triagem cognitiva: perda de autonomia funcional. Considerar avaliação cognitiva.' from public.questionnaires where slug = 'brainfog' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 9, 'As falhas atrapalham de forma importante o seu trabalho?', 'escolha', '[{"label": "Sim", "value": 1}, {"label": "Não", "value": 0}]'::jsonb, false, null, null, null from public.questionnaires where slug = 'brainfog' on conflict do nothing;
insert into public.questions (questionnaire_id, position, text, kind, options, scored, alert_if_gt, alert_kind, alert_message) select id, 10, 'Existe na família história de doença neurodegenerativa, como Alzheimer?', 'escolha', '[{"label": "Sim", "value": 1}, {"label": "Não", "value": 0}]'::jsonb, false, null, null, null from public.questionnaires where slug = 'brainfog' on conflict do nothing;
