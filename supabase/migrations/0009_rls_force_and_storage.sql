-- Harden RLS: force it on every public table, restrict own-row policies to
-- authenticated, and lock the answers storage bucket to each user's folder.

do $$
declare
  r record;
begin
  for r in
    select c.relname as tbl
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
  loop
    execute format('alter table public.%I enable row level security', r.tbl);
    execute format('alter table public.%I force row level security', r.tbl);
    execute format('revoke all on table public.%I from anon', r.tbl);
  end loop;
end $$;

drop policy if exists "Users can manage their own profile" on public.profiles;
create policy "Users can manage their own profile"
  on public.profiles
  for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "own rows" on public.sessions;
drop policy if exists "own rows" on public.answers;
drop policy if exists "own rows" on public.user_words;
drop policy if exists "own rows" on public.daily_progress;
drop policy if exists "own rows" on public.user_feedback;
drop policy if exists "own rows" on public.events;

create policy "own rows" on public.sessions
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.answers
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.user_words
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.daily_progress
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.user_feedback
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.events
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke all on function public.handle_new_user() from public, anon, authenticated;

insert into storage.buckets (id, name, public)
values ('answers', 'answers', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "answers_select_own" on storage.objects;
drop policy if exists "answers_insert_own" on storage.objects;
drop policy if exists "answers_update_own" on storage.objects;
drop policy if exists "answers_delete_own" on storage.objects;

create policy "answers_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'answers' and split_part(name, '/', 1) = auth.uid()::text);

create policy "answers_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'answers' and split_part(name, '/', 1) = auth.uid()::text);

create policy "answers_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'answers' and split_part(name, '/', 1) = auth.uid()::text)
  with check (bucket_id = 'answers' and split_part(name, '/', 1) = auth.uid()::text);

create policy "answers_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'answers' and split_part(name, '/', 1) = auth.uid()::text);
