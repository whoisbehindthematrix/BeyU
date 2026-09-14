-- Streak and daily points: one call per user per calendar day, from the app after a session.
create or replace function public.bump_streak()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.profiles%rowtype;
begin
  select * into p from public.profiles where id = auth.uid();
  if p.last_active_date = current_date then
    return;
  end if;
  update public.profiles set
    streak_days = case
      when p.last_active_date = current_date - 1 then p.streak_days + 1
      else 1
    end,
    last_active_date = current_date,
    total_points = total_points + 10
  where id = auth.uid();
end;
$$;

revoke all on function public.bump_streak() from public;
grant execute on function public.bump_streak() to authenticated;
