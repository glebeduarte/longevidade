-- Módulo de risco de câncer de mama (modelo de Gail / BCRAT) na aba Riscos e cálculos
alter table public.risk_assessments drop constraint risk_assessments_kind_check;
alter table public.risk_assessments add constraint risk_assessments_kind_check
  check (kind in ('prevent', 'frax', 'tev', 'preensao', 'calcio', 'gail'));
