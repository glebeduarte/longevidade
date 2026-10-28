-- Vídeos de orientação: capa, edição completa e arquivos próprios
alter table public.videos add column if not exists thumbnail_url text;
alter table public.videos add column if not exists updated_at timestamptz not null default now();

-- Bucket público para capas e arquivos de vídeo (conteúdo educativo, sem dado de paciente)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', true, 524288000,
  array['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists videos_arq_select on storage.objects;
drop policy if exists videos_arq_insert on storage.objects;
drop policy if exists videos_arq_update on storage.objects;
drop policy if exists videos_arq_delete on storage.objects;
create policy videos_arq_select on storage.objects for select to authenticated using (bucket_id = 'videos');
create policy videos_arq_insert on storage.objects for insert to authenticated with check (bucket_id = 'videos' and public.is_medica());
create policy videos_arq_update on storage.objects for update to authenticated using (bucket_id = 'videos' and public.is_medica());
create policy videos_arq_delete on storage.objects for delete to authenticated using (bucket_id = 'videos' and public.is_medica());
