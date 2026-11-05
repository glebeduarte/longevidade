-- FIB-4 e CKD-EPI 2021 entram nos cálculos de risco da ficha
alter table public.risk_assessments drop constraint risk_assessments_kind_check;
alter table public.risk_assessments add constraint risk_assessments_kind_check
  check (kind in ('prevent', 'frax', 'tev', 'preensao', 'calcio', 'gail', 'fib4', 'ckd'));
