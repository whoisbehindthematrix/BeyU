-- Profiles: one row per auth user, keyed by the same uuid as auth.users.
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  level text check (level in ('beginner', 'intermediate', 'advanced')),
  course_id text,
  streak_days int default 0,
  last_active_date date,
  total_points int default 0,
  created_at timestamptz default now()
);

-- RLS on: no client can read or write profiles unless a policy allows it.
alter table public.profiles enable row level security;

-- Own-row policy: a user may select, insert, update, and delete only where id = auth.uid().
drop policy if exists "Users can manage their own profile" on public.profiles;
create policy "Users can manage their own profile"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Security definer: insert a profile after signup, using full_name or the email prefix.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

-- Fire handle_new_user after every insert on auth.users so a profile always exists.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
