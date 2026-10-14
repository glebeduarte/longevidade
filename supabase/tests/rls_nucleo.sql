-- Testes de acesso da Fase 02. Roda dentro de transação e desfaz tudo no fim.
begin;

create temp table r (teste text, esperado text, obtido text) on commit drop;
grant all on r to authenticated, anon;

insert into auth.users (id, email, aud, role) values
 ('00000000-0000-0000-0000-0000000000a1','medica@t.t','authenticated','authenticated'),
 ('00000000-0000-0000-0000-0000000000a2','assist@t.t','authenticated','authenticated'),
 ('00000000-0000-0000-0000-0000000000a3','nutri@t.t','authenticated','authenticated'),
 ('00000000-0000-0000-0000-0000000000a4','pac1@t.t','authenticated','authenticated'),
 ('00000000-0000-0000-0000-0000000000a5','pac2@t.t','authenticated','authenticated'),
 ('00000000-0000-0000-0000-0000000000a6','semperm@t.t','authenticated','authenticated');

update public.profiles set role='medica' where id='00000000-0000-0000-0000-0000000000a1';
update public.profiles set role='equipe' where id in ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-0000000000a6');
insert into public.team_permissions (user_id, can_manage_patients) values ('00000000-0000-0000-0000-0000000000a2', true);
insert into public.team_permissions (user_id, is_partner) values ('00000000-0000-0000-0000-0000000000a3', true);
insert into public.patients (id, user_id, full_name, email) values
 ('00000000-0000-0000-0000-0000000000b1','00000000-0000-0000-0000-0000000000a4','Paciente 1','pac1@t.t'),
 ('00000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-0000000000a5','Paciente 2','pac2@t.t');
insert into public.partner_assignments values ('00000000-0000-0000-0000-0000000000a3','00000000-0000-0000-0000-0000000000b2');

set local role authenticated;

-- Paciente 1
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}',true);
insert into r select 'paciente vê só a própria ficha','1',count(*)::text from public.patients;
insert into r select 'paciente não vê log de acesso','0',count(*)::text from public.access_logs;
insert into r select 'paciente vê só o próprio perfil','1',count(*)::text from public.profiles;
do $$ begin
  update public.profiles set role='medica' where id=auth.uid();
  insert into r values ('paciente não se promove a médica','bloqueado','permitido');
exception when others then insert into r values ('paciente não se promove a médica','bloqueado','bloqueado'); end $$;
do $$ begin
  insert into public.patients (full_name,email) values ('X','x@t.t');
  insert into r values ('paciente não cadastra paciente','bloqueado','permitido');
exception when others then insert into r values ('paciente não cadastra paciente','bloqueado','bloqueado'); end $$;

-- Assistente com cadastro
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}',true);
insert into r select 'assistente vê todas as pacientes','2',count(*)::text from public.patients;
do $$ begin
  insert into public.patients (full_name,email) values ('Nova','nova@t.t');
  insert into r values ('assistente cadastra paciente','permitido','permitido');
exception when others then insert into r values ('assistente cadastra paciente','permitido','bloqueado'); end $$;
do $$ begin
  update public.team_permissions set can_view_clinical=true where user_id=auth.uid();
  insert into r select 'assistente não altera as próprias permissões','false', can_view_clinical::text from public.team_permissions where user_id=auth.uid();
end $$;

-- Nutricionista parceira
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}',true);
insert into r select 'parceira vê só a paciente vinculada','1',count(*)::text from public.patients;

-- Equipe sem permissão
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a6","role":"authenticated"}',true);
insert into r select 'equipe sem permissão não vê pacientes','0',count(*)::text from public.patients;

-- Médica
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}',true);
insert into r select 'médica vê todas as pacientes','3',count(*)::text from public.patients;
select public.log_access('00000000-0000-0000-0000-0000000000b1','ficha');
insert into r select 'médica lê o registro de acesso','1',count(*)::text from public.access_logs;

-- Visitante sem login
reset role; set local role anon;
insert into r select 'visitante não vê pacientes','0',count(*)::text from public.patients;

reset role;
select teste, esperado, obtido, esperado = obtido as passou from r;
rollback;
