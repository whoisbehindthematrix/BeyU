-- UI flags that used to live in localStorage (byou_auth / byou_progress).
alter table public.profiles
  add column if not exists seen_tour boolean not null default false;

alter table public.profiles
  add column if not exists plan text not null default 'free';

alter table public.profiles
  drop constraint if exists profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check check (plan in ('free', 'pro'));
