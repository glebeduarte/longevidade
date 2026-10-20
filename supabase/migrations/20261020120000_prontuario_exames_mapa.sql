-- Caminho 2: prontuário leve, exames e medidas, fatores de risco e mapa da saúde

create type public.tipo_nota as enum ('evolucao', 'anotacao');
create type public.tipo_conduta as enum ('medicacao', 'plano');
create type public.status_mapa as enum ('em_andamento', 'finalizado', 'suspenso');

-- Catálogo de indicadores (exames e medidas), com faixas editáveis pela médica.
-- bands: lista em ordem crescente [{ "max": número ou null, "level": nivel }]. O valor cai na primeira faixa com valor < max.
create table public.indicator_catalog (
  code text primary key,
  name text not null,
  unit text not null default '',
  grp text not null,
  kind text not null check (kind in ('exame', 'medida')),
  core boolean not null default false,
  sort int not null default 100,
  bands jsonb not null default '[]',
  reviewed boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  code text not null references public.indicator_catalog(code),
  value numeric not null,
  measured_at date not null default current_date,
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index on public.measurements (patient_id, code, measured_at desc);

create table public.risk_factors (
  patient_id uuid primary key references public.patients(id) on delete cascade,
  sex text not null default 'F' check (sex in ('F', 'M')),
  ethnicity text,
  smoking text,
  diseases text[] not null default '{}',
  parent_diabetes boolean,
  meds text[] not null default '{}',
  colonoscopy boolean,
  family_cvd boolean,
  cvd text[] not null default '{}',
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  kind public.tipo_nota not null default 'evolucao',
  noted_at date not null default current_date,
  body text not null,
  author uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.clinical_notes (patient_id, noted_at desc);

create table public.problems (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text not null,
  detail text,
  active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index on public.problems (patient_id, active);

create table public.conducts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  kind public.tipo_conduta not null,
  title text not null,
  detail text,
  active boolean not null default true,
  started_at date not null default current_date,
  ended_at date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index on public.conducts (patient_id, active);

create table public.health_maps (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  status public.status_mapa not null default 'em_andamento',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  summary text,
  recommendations jsonb not null default '{}',
  snapshot jsonb,
  created_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id)
);
create unique index health_maps_um_aberto on public.health_maps (patient_id) where status = 'em_andamento';

create table public.recommendation_blocks (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  level public.nivel_faixa not null,
  text text not null,
  sort int not null default 0
);

-- RLS
alter table public.indicator_catalog enable row level security;
alter table public.measurements enable row level security;
alter table public.risk_factors enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.problems enable row level security;
alter table public.conducts enable row level security;
alter table public.health_maps enable row level security;
alter table public.recommendation_blocks enable row level security;

create policy ic_select on public.indicator_catalog for select to authenticated using (true);
create policy ic_write on public.indicator_catalog for all to authenticated using (public.is_medica()) with check (public.is_medica());

create policy rb_select on public.recommendation_blocks for select to authenticated using (true);
create policy rb_write on public.recommendation_blocks for all to authenticated using (public.is_medica()) with check (public.is_medica());

create policy ms_select on public.measurements for select to authenticated using (public.can_see_patient(patient_id));
create policy ms_insert on public.measurements for insert to authenticated with check (public.has_perm('upload_measurements'));
create policy ms_delete on public.measurements for delete to authenticated using (public.has_perm('upload_measurements'));

create policy rf_select on public.risk_factors for select to authenticated
  using (public.has_perm('view_clinical') or public.has_perm('manage_patients'));
create policy rf_write on public.risk_factors for all to authenticated
  using (public.has_perm('view_clinical') or public.has_perm('manage_patients'))
  with check (public.has_perm('view_clinical') or public.has_perm('manage_patients'));

-- Prontuário: só médica e equipe com acesso clínico. A paciente não vê.
create policy cn_select on public.clinical_notes for select to authenticated using (public.has_perm('view_clinical'));
create policy cn_insert on public.clinical_notes for insert to authenticated with check (public.has_perm('view_clinical') and author = auth.uid());
create policy cn_update on public.clinical_notes for update to authenticated using (author = auth.uid() or public.is_medica()) with check (author = auth.uid() or public.is_medica());
create policy cn_delete on public.clinical_notes for delete to authenticated using (public.is_medica());

create policy pb_all on public.problems for all to authenticated using (public.has_perm('view_clinical')) with check (public.has_perm('view_clinical'));
create policy cd_all on public.conducts for all to authenticated using (public.has_perm('view_clinical')) with check (public.has_perm('view_clinical'));

-- Mapa: equipe clínica vê e edita; a paciente vê só os finalizados dela.
create policy hm_select on public.health_maps for select to authenticated
  using (public.has_perm('view_clinical') or (status = 'finalizado' and public.is_my_patient(patient_id)));
create policy hm_write on public.health_maps for insert to authenticated with check (public.has_perm('view_clinical'));
create policy hm_update on public.health_maps for update to authenticated
  using (public.has_perm('view_clinical')) with check (public.has_perm('view_clinical'));

-- Catálogo. Faixas padrão para mulheres no climatério, marcadas como não revisadas.
insert into public.indicator_catalog (code, name, unit, grp, kind, core, sort, bands) values
('peso','Peso','kg','metabolismo','medida',true,1,'[]'),
('altura','Altura','cm','metabolismo','medida',true,2,'[]'),
('cintura','Circunferência abdominal','cm','metabolismo','medida',true,3,'[{"max":80,"level":"otimo"},{"max":84,"level":"bom"},{"max":88,"level":"atencao"},{"max":null,"level":"ruim"}]'),
('pescoco','Circunferência do pescoço','cm','metabolismo','medida',true,4,'[{"max":34,"level":"otimo"},{"max":37,"level":"normal"},{"max":40,"level":"atencao"},{"max":null,"level":"ruim"}]'),
('pgc','Percentual de gordura','%','metabolismo','medida',true,5,'[{"max":25,"level":"otimo"},{"max":32,"level":"bom"},{"max":38,"level":"atencao"},{"max":null,"level":"ruim"}]'),
('pas','Pressão sistólica','mmHg','cardiovascular','medida',true,10,'[{"max":90,"level":"atencao"},{"max":120,"level":"otimo"},{"max":130,"level":"bom"},{"max":140,"level":"atencao"},{"max":null,"level":"ruim"}]'),
('pad','Pressão diastólica','mmHg','cardiovascular','medida',true,11,'[{"max":60,"level":"atencao"},{"max":80,"level":"otimo"},{"max":85,"level":"bom"},{"max":90,"level":"atencao"},{"max":null,"level":"ruim"}]'),
('fc','Frequência cardíaca de repouso','bpm','cardiovascular','medida',true,12,'[{"max":50,"level":"atencao"},{"max":60,"level":"otimo"},{"max":70,"level":"bom"},{"max":80,"level":"normal"},{"max":100,"level":"atencao"},{"max":null,"level":"ruim"}]'),
('preensao','Força de preensão','kgf','fisico','medida',true,20,'[{"max":16,"level":"ruim"},{"max":20,"level":"atencao"},{"max":25,"level":"normal"},{"max":30,"level":"bom"},{"max":null,"level":"otimo"}]'),
('sentar_levantar','Sentar e levantar em 30 s','rep.','fisico','medida',true,21,'[{"max":10,"level":"ruim"},{"max":12,"level":"atencao"},{"max":15,"level":"normal"},{"max":18,"level":"bom"},{"max":null,"level":"otimo"}]'),
('vo2','VO2 máximo','ml/kg/min','cardiovascular','medida',true,22,'[{"max":20,"level":"ruim"},{"max":25,"level":"atencao"},{"max":30,"level":"normal"},{"max":35,"level":"bom"},{"max":null,"level":"otimo"}]'),
('ct','Colesterol total','mg/dl','cardiovascular','exame',true,30,'[{"max":170,"level":"otimo"},{"max":190,"level":"bom"},{"max":200,"level":"normal"},{"max":240,"level":"atencao"},{"max":null,"level":"ruim"}]'),
('hdl','HDL','mg/dl','cardiovascular','exame',true,31,'[{"max":40,"level":"ruim"},{"max":50,"level":"atencao"},{"max":60,"level":"normal"},{"max":80,"level":"bom"},{"max":null,"level":"otimo"}]'),
('ldl','LDL','mg/dl','cardiovascular','exame',true,32,'[{"max":70,"level":"otimo"},{"max":100,"level":"bom"},{"max":130,"level":"normal"},{"max":160,"level":"atencao"},{"max":null,"level":"ruim"}]'),
('tg','Triglicerídeos','mg/dl','cardiovascular','exame',true,33,'[{"max":100,"level":"otimo"},{"max":130,"level":"bom"},{"max":150,"level":"normal"},{"max":200,"level":"atencao"},{"max":null,"level":"ruim"}]'),
('glicose','Glicose','mg/dl','metabolismo','exame',true,40,'[{"max":70,"level":"atencao"},{"max":85,"level":"otimo"},{"max":92,"level":"bom"},{"max":100,"level":"normal"},{"max":126,"level":"atencao"},{"max":null,"level":"ruim"}]'),
('hba1c','Hemoglobina glicada','%','metabolismo','exame',true,41,'[{"max":5.2,"level":"otimo"},{"max":5.5,"level":"bom"},{"max":5.7,"level":"normal"},{"max":6.5,"level":"atencao"},{"max":null,"level":"ruim"}]'),
('tsh','TSH','mU/L','metabolismo','exame',true,42,'[{"max":0.1,"level":"ruim"},{"max":0.4,"level":"atencao"},{"max":2.5,"level":"otimo"},{"max":4,"level":"normal"},{"max":10,"level":"atencao"},{"max":null,"level":"ruim"}]'),
('b12','Vitamina B12','pg/ml','metabolismo','exame',true,43,'[{"max":200,"level":"ruim"},{"max":300,"level":"atencao"},{"max":400,"level":"normal"},{"max":1000,"level":"otimo"},{"max":null,"level":"normal"}]'),
('vitd','Vitamina D','ng/ml','metabolismo','exame',true,44,'[{"max":12,"level":"ruim"},{"max":20,"level":"atencao"},{"max":30,"level":"normal"},{"max":60,"level":"otimo"},{"max":100,"level":"normal"},{"max":null,"level":"ruim"}]'),
('ferritina','Ferritina','ng/ml','metabolismo','exame',true,45,'[{"max":15,"level":"ruim"},{"max":30,"level":"atencao"},{"max":50,"level":"normal"},{"max":150,"level":"otimo"},{"max":300,"level":"normal"},{"max":500,"level":"atencao"},{"max":null,"level":"ruim"}]'),
('tgo','TGO','U/L','figado','exame',true,50,'[{"max":25,"level":"otimo"},{"max":33,"level":"bom"},{"max":40,"level":"normal"},{"max":80,"level":"atencao"},{"max":null,"level":"ruim"}]'),
('tgp','TGP','U/L','figado','exame',true,51,'[{"max":25,"level":"otimo"},{"max":33,"level":"bom"},{"max":40,"level":"normal"},{"max":80,"level":"atencao"},{"max":null,"level":"ruim"}]'),
('ggt','GGT','U/L','figado','exame',true,52,'[{"max":20,"level":"otimo"},{"max":30,"level":"bom"},{"max":40,"level":"normal"},{"max":80,"level":"atencao"},{"max":null,"level":"ruim"}]'),
('plaquetas','Plaquetas','mil/mm³','figado','exame',true,53,'[{"max":100,"level":"ruim"},{"max":150,"level":"atencao"},{"max":450,"level":"normal"},{"max":600,"level":"atencao"},{"max":null,"level":"ruim"}]'),
('creatinina','Creatinina','mg/dl','rins','exame',true,60,'[{"max":0.5,"level":"normal"},{"max":1.0,"level":"otimo"},{"max":1.1,"level":"normal"},{"max":1.5,"level":"atencao"},{"max":null,"level":"ruim"}]'),
('insulina','Insulina de jejum','µU/ml','metabolismo','exame',false,70,'[]'),
('pcr','Proteína C reativa','mg/l','cardiovascular','exame',false,71,'[]'),
('lpa','Lipoproteína (a)','nmol/l','cardiovascular','exame',false,72,'[]'),
('apob','Apo B','mg/dl','cardiovascular','exame',false,73,'[]'),
('acido_urico','Ácido úrico','mg/dl','metabolismo','exame',false,74,'[]'),
('t4l','T4 livre','ng/dl','metabolismo','exame',false,75,'[]'),
('estradiol','Estradiol','pg/ml','hormonios','exame',false,80,'[]'),
('fsh','FSH','mUI/ml','hormonios','exame',false,81,'[]'),
('lh','LH','mUI/ml','hormonios','exame',false,82,'[]'),
('progesterona','Progesterona','ng/ml','hormonios','exame',false,83,'[]'),
('testosterona_total','Testosterona total','ng/dl','hormonios','exame',false,84,'[]'),
('shbg','SHBG','nmol/l','hormonios','exame',false,85,'[]'),
('sdhea','SDHEA','µg/dl','hormonios','exame',false,86,'[]'),
('prolactina','Prolactina','ng/ml','hormonios','exame',false,87,'[]'),
('hemoglobina','Hemoglobina','g/dl','outros','exame',false,90,'[]'),
('ferro','Ferro','µg/dl','outros','exame',false,91,'[]'),
('magnesio','Magnésio','mg/dl','outros','exame',false,92,'[]'),
('calcio','Cálcio','mg/dl','outros','exame',false,93,'[]'),
('homocisteina','Homocisteína','µmol/l','outros','exame',false,94,'[]'),
('pth','PTH','pg/ml','outros','exame',false,95,'[]');

-- Blocos de recomendação padrão por domínio e faixa (editáveis).
insert into public.recommendation_blocks (domain, level, text, sort) values
('Humor','ruim','Seu humor merece cuidado agora. Vamos olhar isso juntas com calma e decidir o melhor caminho de tratamento.',1),
('Humor','atencao','Seu humor pede atenção. Atividades em grupo, psicoterapia, meditação ou tai chi costumam ajudar.',1),
('Humor','otimo','Seu humor está bem cuidado. Continue com o que tem feito por você.',1),
('Sono','ruim','Seu sono está prejudicado. Vamos investigar as causas e montar um plano para noites mais tranquilas.',1),
('Sono','atencao','Pequenos ajustes de rotina ajudam o sono: horário fixo para deitar, luz baixa à noite e menos tela antes de dormir.',1),
('Sono','otimo','Seu sono está protegendo sua saúde. Mantenha a rotina.',1),
('Alimentação','ruim','A base do prato pede mudança: verduras, legumes, frutas, grãos integrais e leguminosas em quase todas as refeições.',1),
('Alimentação','atencao','Seu prato está no caminho. Inclua duas a três porções de frutas por dia e troque refinados por integrais.',1),
('Alimentação','otimo','Sua alimentação está bem estruturada. Continue variando cores no prato.',1),
('Álcool','ruim','O consumo de álcool está acima do seguro para você. Vamos conversar sobre como reduzir.',1),
('Álcool','otimo','Sem álcool, então? Continue assim. Mesmo o consumo moderado aumenta o risco de alguns cânceres.',1),
('Cigarro','ruim','Parar de fumar é a mudança que mais protege sua saúde. Existe tratamento e você não precisa fazer isso sozinha.',1),
('Cigarro','otimo','Pulmões livres de tabaco.',1),
('Atividade física','ruim','Comece com caminhadas leves e aumente aos poucos até ficar levemente ofegante. 150 minutos por semana já fazem diferença.',1),
('Atividade física','atencao','Inclua treino de força duas vezes por semana e exercícios de equilíbrio. Quedas são uma das principais causas de perda de autonomia depois dos 65.',1),
('Atividade física','otimo','Sua rotina de movimento está protegendo músculos, ossos e coração.',1);
