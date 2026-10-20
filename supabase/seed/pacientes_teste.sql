-- Duas pacientes fictícias para conferir as telas. Nomes terminam em "(teste)".
-- Para apagar: delete from public.patients where email like '%@teste.longevidade';
do $$
declare
  medica uuid := (select id from public.profiles where email = 'glebejr@gmail.com');
  claudia uuid; renata uuid; m uuid;

begin
  delete from public.patients where email like '%@teste.longevidade';

  insert into public.patients (full_name, email, phone, birth_date, location, created_by)
  values ('Cláudia Menezes (teste)', 'claudia@teste.longevidade', '(84) 99999-0001', '1974-03-18', 'equilibre', medica) returning id into claudia;
  insert into public.patients (full_name, email, phone, birth_date, location, created_by)
  values ('Renata Albuquerque (teste)', 'renata@teste.longevidade', '(84) 99999-0002', '1968-07-02', 'spinel', medica) returning id into renata;

  -- Medidas e exames
  insert into public.measurements (patient_id, code, value, measured_at, created_by)
  select claudia, c, v, d::date, medica from (values
    ('altura',163,'2026-07-08'),('peso',74.8,'2026-07-08'),('cintura',93,'2026-07-08'),('pescoco',35,'2026-07-08'),('pgc',39.1,'2026-07-08'),('pas',132,'2026-07-08'),('pad',84,'2026-07-08'),('fc',78,'2026-07-08'),
    ('peso',72.1,'2026-10-06'),('cintura',89,'2026-10-06'),('pgc',37.2,'2026-10-06'),('pas',124,'2026-10-06'),('pad',80,'2026-10-06'),('fc',72,'2026-10-06'),('preensao',18,'2026-10-06'),('sentar_levantar',11,'2026-10-06'),
    ('ct',262,'2026-07-01'),('hdl',54,'2026-07-01'),('ldl',178,'2026-07-01'),('tg',152,'2026-07-01'),('glicose',96,'2026-07-01'),('hba1c',5.6,'2026-07-01'),('tsh',2.8,'2026-07-01'),
    ('b12',176,'2026-07-01'),('vitd',19,'2026-07-01'),('ferritina',38,'2026-07-01'),('tgo',21,'2026-07-01'),('tgp',24,'2026-07-01'),('ggt',22,'2026-07-01'),('plaquetas',248,'2026-07-01'),('creatinina',0.74,'2026-07-01'),
    ('fsh',68,'2026-07-01'),('estradiol',18,'2026-07-01'),
    ('ct',231,'2026-10-01'),('hdl',57,'2026-10-01'),('ldl',149,'2026-10-01'),('tg',126,'2026-10-01'),('b12',338,'2026-10-01'),('vitd',31,'2026-10-01'),('glicose',91,'2026-10-01')
  ) as t(c, v, d);

  insert into public.measurements (patient_id, code, value, measured_at, created_by)
  select renata, c, v, d::date, medica from (values
    ('altura',158,'2026-04-14'),('peso',81.5,'2026-04-14'),('cintura',101,'2026-04-14'),('pescoco',38,'2026-04-14'),('pgc',43.0,'2026-04-14'),('pas',146,'2026-04-14'),('pad',92,'2026-04-14'),('fc',81,'2026-04-14'),('preensao',15,'2026-04-14'),('sentar_levantar',9,'2026-04-14'),
    ('peso',77.9,'2026-10-13'),('cintura',96,'2026-10-13'),('pgc',40.6,'2026-10-13'),('pas',134,'2026-10-13'),('pad',84,'2026-10-13'),('fc',74,'2026-10-13'),('preensao',18,'2026-10-13'),('sentar_levantar',12,'2026-10-13'),
    ('ct',214,'2026-04-08'),('hdl',44,'2026-04-08'),('ldl',132,'2026-04-08'),('tg',212,'2026-04-08'),('glicose',112,'2026-04-08'),('hba1c',6.2,'2026-04-08'),('tsh',3.6,'2026-04-08'),
    ('b12',402,'2026-04-08'),('vitd',22,'2026-04-08'),('ferritina',286,'2026-04-08'),('tgo',38,'2026-04-08'),('tgp',61,'2026-04-08'),('ggt',74,'2026-04-08'),('plaquetas',198,'2026-04-08'),('creatinina',0.92,'2026-04-08'),
    ('insulina',18.4,'2026-04-08'),
    ('ct',196,'2026-10-07'),('hdl',47,'2026-10-07'),('ldl',118,'2026-10-07'),('tg',158,'2026-10-07'),('glicose',104,'2026-10-07'),('hba1c',5.9,'2026-10-07'),
    ('vitd',34,'2026-10-07'),('tgo',29,'2026-10-07'),('tgp',42,'2026-10-07'),('ggt',51,'2026-10-07'),('plaquetas',205,'2026-10-07'),('creatinina',0.95,'2026-10-07')
  ) as t(c, v, d);

  -- Fatores de risco
  insert into public.risk_factors (patient_id, sex, ethnicity, smoking, diseases, parent_diabetes, meds, colonoscopy, family_cvd, cvd, updated_by)
  values (claudia, 'F', 'Parda', 'Não fumante', '{}', false, '{Sono}', false, true, '{}', medica),
         (renata, 'F', 'Branca', 'Ex-fumante', '{}', true, '{"Pressão alta"}', true, false, '{}', medica);

  -- Prontuário
  insert into public.clinical_notes (patient_id, kind, noted_at, body, author, created_at) values
  (claudia, 'evolucao', '2026-07-08', E'Primeiro encontro do programa Longevidade (Essencial).\n\nQueixa principal: fogachos 8 a 10 vezes por dia, acorda 3x por noite, irritabilidade. Ciclos irregulares há 14 meses, última menstruação há 5 meses.\n\nAntecedentes: mãe com infarto aos 61. Nega tabagismo. Usa zolpidem eventual.\n\nExame: PA 132/84, FC 78, cintura 93 cm.\n\nImpressão: transição menopausal tardia com sintomas vasomotores intensos, insônia, dislipidemia e deficiência de B12 e vitamina D.\n\nConduta: TRH transdérmica, B12 e vitamina D, treino de força 2x por semana. Questionários enviados.', medica, '2026-07-08 14:00-03'),
  (claudia, 'anotacao', '2026-07-08', 'Prefere contato por mensagem à tarde. Marido viaja muito, está sobrecarregada com a mãe idosa.', medica, '2026-07-08 14:30-03'),
  (claudia, 'evolucao', '2026-10-06', E'Encontro de seguimento (mês 3).\n\nFogachos caíram para 1 a 2 por dia. Sono melhor, ainda acorda 1x. Começou musculação há 6 semanas, 2x por semana.\n\nExames: LDL 178 para 149, B12 e vitamina D normalizadas.\n\nPeso 74,8 para 72,1 kg, cintura 93 para 89 cm.\n\nAjustes: manter TRH, aumentar força para 3x, reavaliar humor (PHQ-9 ainda moderado). Considerar psicoterapia.', medica, '2026-10-06 15:00-03'),
  (renata, 'evolucao', '2026-04-14', E'Primeiro encontro do programa Longevidade (Anual).\n\nPós-menopausa há 7 anos. Hipertensa em uso de losartana. Ex-fumante (parou há 12 anos, 15 maços-ano). Mãe diabética.\n\nQueixas: cansaço, ganho de 9 kg em 3 anos, dores articulares, ronco relatado pelo marido.\n\nExame: PA 146/92, cintura 101 cm, preensão 15 kgf.\n\nImpressão: pré-diabetes com resistência insulínica, provável esteatose (TGP e GGT elevadas), sarcopenia, hipertensão não controlada, suspeita de apneia.\n\nConduta: ajuste anti-hipertensivo, nutricionista parceira, treino de força supervisionado, polissonografia, ultrassom de abdome.', medica, '2026-04-14 10:00-03'),
  (renata, 'evolucao', '2026-10-13', E'Encontro do mês 6.\n\nPerdeu 3,6 kg, cintura 101 para 96 cm. PA 134/84. HbA1c 6,2 para 5,9. Enzimas hepáticas em queda.\n\nPolissonografia: apneia leve, IAH 9. Mantém CPAP em avaliação.\n\nMapa da saúde de seis meses aberto para comparar com o inicial.', medica, '2026-10-13 10:00-03');

  insert into public.problems (patient_id, title, detail, active, created_by, resolved_at) values
  (claudia, 'Sintomas vasomotores do climatério', 'fogachos e despertares noturnos', true, medica, null),
  (claudia, 'Dislipidemia', 'LDL 149 mg/dl em 01/10/2026', true, medica, null),
  (claudia, 'Deficiência de vitamina B12', 'corrigida com reposição', false, medica, '2026-10-06'),
  (claudia, 'Humor deprimido', 'PHQ-9 moderado', true, medica, null),
  (renata, 'Pré-diabetes', 'HbA1c 5,9%', true, medica, null),
  (renata, 'Hipertensão arterial', 'em uso de losartana', true, medica, null),
  (renata, 'Esteatose hepática provável', 'TGP 42, GGT 51', true, medica, null),
  (renata, 'Sarcopenia', 'preensão 18 kgf', true, medica, null),
  (renata, 'Apneia obstrutiva do sono leve', 'IAH 9', true, medica, null);

  insert into public.conducts (patient_id, kind, title, detail, active, started_at, ended_at, created_by) values
  (claudia, 'medicacao', 'Estradiol gel 0,75 mg', '1 dose na pele à noite', true, '2026-07-08', null, medica),
  (claudia, 'medicacao', 'Progesterona micronizada 100 mg', '1 cápsula ao deitar', true, '2026-07-08', null, medica),
  (claudia, 'medicacao', 'Vitamina B12 1.000 mcg', 'sublingual por 90 dias', false, '2026-07-08', '2026-10-06', medica),
  (claudia, 'medicacao', 'Vitamina D 7.000 UI', 'semanal', true, '2026-07-08', null, medica),
  (claudia, 'plano', 'Musculação 3x por semana', 'aumentar carga aos poucos', true, '2026-10-06', null, medica),
  (claudia, 'plano', 'Avaliar psicoterapia', 'indicação entregue', true, '2026-10-06', null, medica),
  (renata, 'medicacao', 'Losartana 50 mg', '12/12 h', true, '2026-04-14', null, medica),
  (renata, 'medicacao', 'Metformina XR 500 mg', 'no jantar', true, '2026-04-14', null, medica),
  (renata, 'plano', 'Nutricionista parceira', 'consulta mensal', true, '2026-04-14', null, medica),
  (renata, 'plano', 'Treino de força supervisionado', '2x por semana', true, '2026-04-14', null, medica),
  (renata, 'plano', 'Polissonografia', 'realizada em agosto', false, '2026-04-14', '2026-08-20', medica);
end $$;

-- Questionários respondidos (o gatilho calcula escore e faixa)
create or replace function pg_temp.responder(p_email text, p_slug text, vals numeric[], quando timestamptz) returns void language plpgsql as $f$
declare pid uuid := (select id from public.patients where email = p_email); qid uuid := (select id from public.questionnaires where slug = p_slug); aid uuid;
begin
  insert into public.questionnaire_assignments (patient_id, questionnaire_id, created_at) values (pid, qid, quando - interval '2 days') returning id into aid;
  insert into public.questionnaire_responses (assignment_id, patient_id, questionnaire_id, answers, submitted_at)
  select aid, pid, qid, jsonb_object_agg(q.id::text, vals[q.position]), quando from public.questions q where q.questionnaire_id = qid and vals[q.position] is not null;
end $f$;

select pg_temp.responder('claudia@teste.longevidade', s, v, w) from (values
 ('phq9','{2,2,1,2,1,1,1,1,0,1}'::numeric[],'2026-07-06 20:00-03'::timestamptz),('gad7','{1,2,1,1,1,1,1,1}','2026-07-06 20:00-03'),
 ('isi','{3,3,2,3,3,2,3}','2026-07-06 20:00-03'),('stopbang','{1,0,0,0,0,0,0,0}','2026-07-06 20:00-03'),
 ('dst','{1,1,1,1,1,1,2,2}','2026-07-06 20:00-03'),('integrais','{0.21,0.07,0.21,0}','2026-07-06 20:00-03'),
 ('ultraprocessados','{1,0,1,0,0,1,0,1,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0}','2026-07-06 20:00-03'),
 ('auditc','{1,0,0}','2026-07-06 20:00-03'),('cigarro','{0}','2026-07-06 20:00-03'),('atividade','{90,2,0,0,5200}','2026-07-06 20:00-03'),
 ('phq9','{1,2,1,2,1,1,1,1,0,1}','2026-10-03 19:00-03'),('isi','{1,2,1,1,1,1,1}','2026-10-03 19:00-03'),('atividade','{150,3,1,0,7800}','2026-10-03 19:00-03')
) t(s, v, w);

select pg_temp.responder('renata@teste.longevidade', s, v, w) from (values
 ('phq9','{1,1,0,1,1,0,0,0,0,0}'::numeric[],'2026-04-12 09:00-03'::timestamptz),('gad7','{1,1,1,0,1,0,1,0}','2026-04-12 09:00-03'),
 ('isi','{1,1,1,2,1,1,1}','2026-04-12 09:00-03'),('stopbang','{1,1,0,1,1,1,0,1}','2026-04-12 09:00-03'),
 ('dst','{0,0,1,1,0,1,1,1}','2026-04-12 09:00-03'),('integrais','{0,0,0.07,0}','2026-04-12 09:00-03'),
 ('ultraprocessados','{1,1,1,0,1,1,0,1,1,0,1,0,1,1,0,0,1,0,0,0,0,0,1}','2026-04-12 09:00-03'),
 ('auditc','{2,0,0}','2026-04-12 09:00-03'),('cigarro','{0}','2026-04-12 09:00-03'),('atividade','{40,0,0,0,3500}','2026-04-12 09:00-03'),
 ('phq9','{0,1,0,1,0,0,0,0,0,0}','2026-10-10 09:00-03'),('gad7','{1,0,1,0,0,0,1,0}','2026-10-10 09:00-03'),
 ('isi','{1,0,1,1,1,0,1}','2026-10-10 09:00-03'),('stopbang','{1,1,0,1,1,0,0,1}','2026-10-10 09:00-03'),
 ('dst','{1,1,2,1,1,2,1,2}','2026-10-10 09:00-03'),('integrais','{0.5,0.21,0.21,0.07}','2026-10-10 09:00-03'),
 ('ultraprocessados','{1,0,1,0,0,1,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0}','2026-10-10 09:00-03'),
 ('auditc','{1,0,0}','2026-10-10 09:00-03'),('cigarro','{0}','2026-10-10 09:00-03'),('atividade','{160,2,1,1,7400}','2026-10-10 09:00-03')
) t(s, v, w);

-- Questionário ainda pendente para Cláudia (aparece em Aguardando resposta)
insert into public.questionnaire_assignments (patient_id, questionnaire_id, created_at)
select p.id, q.id, '2026-10-06 16:00-03' from public.patients p, public.questionnaires q where p.email = 'claudia@teste.longevidade' and q.slug in ('dst', 'ultraprocessados');

-- Mapas: Cláudia com mapa em andamento; Renata com o inicial finalizado e o de 6 meses aberto
insert into public.health_maps (patient_id, status, started_at, created_by)
select id, 'em_andamento', '2026-10-06 15:30-03', (select id from public.profiles where email = 'glebejr@gmail.com') from public.patients where email = 'claudia@teste.longevidade';
insert into public.health_maps (patient_id, status, started_at, created_by, summary)
select id, 'em_andamento', '2026-10-13 10:30-03', (select id from public.profiles where email = 'glebejr@gmail.com'),
 'Seis meses de muito trabalho e resultado visível: cintura, pressão e glicada caíram. Agora o foco é força e sono.' from public.patients where email = 'renata@teste.longevidade';
