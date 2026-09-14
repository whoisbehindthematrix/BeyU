alter table public.daily_progress
  add column if not exists digest_shown boolean default false;
