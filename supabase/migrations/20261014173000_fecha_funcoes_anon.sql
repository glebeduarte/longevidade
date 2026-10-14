-- Funções internas só para quem fez login; termo publicado visível sem login
revoke execute on function public.my_role(), public.is_medica(), public.has_perm(text), public.can_see_patient(uuid) from anon, public;
grant execute on function public.my_role(), public.is_medica(), public.has_perm(text), public.can_see_patient(uuid), public.log_access(uuid, text, text) to authenticated;
alter policy terms_select on public.consent_terms to authenticated using (published_at is not null or public.is_medica());
create policy terms_select_anon on public.consent_terms for select to anon using (published_at is not null);
