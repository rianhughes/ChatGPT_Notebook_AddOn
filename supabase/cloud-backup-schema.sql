-- ChatGPT Notebook cloud backup schema.
-- Run this in the Supabase SQL editor, then create a private Storage bucket named
-- "notebook-backups" with a 10 MB file-size limit and these MIME types:
-- application/json, image/png, image/jpeg, image/webp, image/gif.

create table if not exists public.cloud_backups (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('latest', 'daily', 'manual')),
  backup_date date,
  data_revision integer not null,
  backup_version integer not null,
  snapshot_path text not null,
  snapshot_sha256 text not null,
  byte_size bigint not null,
  asset_count integer not null default 0,
  encrypted boolean not null default false,
  compression text not null default 'none',
  exported_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists cloud_backups_user_exported_at_idx
  on public.cloud_backups (user_id, exported_at desc);

alter table public.cloud_backups enable row level security;

drop policy if exists "Users can read their own cloud backups" on public.cloud_backups;
create policy "Users can read their own cloud backups"
  on public.cloud_backups
  for select
  to authenticated
  using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Users can write their own cloud backups" on public.cloud_backups;
create policy "Users can write their own cloud backups"
  on public.cloud_backups
  for insert
  to authenticated
  with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Users can update their own cloud backups" on public.cloud_backups;
create policy "Users can update their own cloud backups"
  on public.cloud_backups
  for update
  to authenticated
  using (auth.uid() is not null and auth.uid() = user_id)
  with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Users can remove their own cloud backups" on public.cloud_backups;
create policy "Users can remove their own cloud backups"
  on public.cloud_backups
  for delete
  to authenticated
  using (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "Users can read their own backup objects" on storage.objects;
create policy "Users can read their own backup objects"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'notebook-backups'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can write their own backup objects" on storage.objects;
create policy "Users can write their own backup objects"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'notebook-backups'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update their own backup objects" on storage.objects;
create policy "Users can update their own backup objects"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'notebook-backups'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'notebook-backups'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can remove their own backup objects" on storage.objects;
create policy "Users can remove their own backup objects"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'notebook-backups'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
