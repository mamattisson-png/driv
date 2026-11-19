-- Utmaningar och månadens topplista i Driv. Kör i Supabase: SQL Editor → New query → klistra in → Run.
-- Kräver att vanner.sql redan är kört. Precis som för vänner delas bara antal pass, aldrig vikter,
-- mat eller kroppsvikt. Tabellen går inte att läsa direkt; allt går via funktionerna nedan.

create table if not exists public.driv_challenges (
  id bigint generated always as identity primary key,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  opponent uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('forst', 'flest')),     -- först till ett antal pass, eller flest pass
  goal int check (goal between 1 and 100),
  start_day date not null,
  end_day date not null,
  created_at timestamptz not null default now(),
  check (created_by <> opponent),
  check (end_day >= start_day and end_day - start_day <= 92),
  check (kind = 'flest' or goal is not null)
);
alter table public.driv_challenges enable row level security;

-- Antal pass för en själv och vännerna som delar, mellan två datum (högst ett kvartal)
create or replace function public.driv_board(p_from date, p_to date) returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('name', p.name, 'me', p.user_id = auth.uid(),
      'n', (select count(*) from driv_activity a where a.user_id = p.user_id and a.day between p_from and p_to))
    order by p.name), '[]'::json)
  from driv_profiles p
  where p.sharing and p_to >= p_from and p_to - p_from <= 92
    and (p.user_id = auth.uid() or p.user_id in (select friend_id from driv_friends where user_id = auth.uid()));
$$;

-- Ny utmaning mot en vän. Högst tio pågående åt gången.
create or replace function public.driv_challenge_create(p_friend uuid, p_kind text, p_goal int, p_start date, p_end date) returns bigint
language plpgsql security definer set search_path = public as $$
declare new_id bigint;
begin
  if auth.uid() is null then raise exception 'Inte inloggad'; end if;
  if not exists (select 1 from driv_friends where user_id = auth.uid() and friend_id = p_friend) then raise exception 'Inte en vän'; end if;
  if (select count(*) from driv_challenges where auth.uid() in (created_by, opponent) and end_day >= current_date) >= 10 then
    raise exception 'Du har redan tio pågående utmaningar';
  end if;
  insert into driv_challenges (created_by, opponent, kind, goal, start_day, end_day)
    values (auth.uid(), p_friend, p_kind, case when p_kind = 'forst' then p_goal end, p_start, p_end)
    returning id into new_id;
  return new_id;
end $$;

-- Ens utmaningar (pågående och de som slutade senaste veckan) med båda sidornas antal pass
-- och dagen då var och en nådde målet (för "först till")
create or replace function public.driv_challenges() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(r order by r.end_day, r.id), '[]'::json) from (
    select c.id, c.kind, c.goal, c.start_day, c.end_day, c.created_by = auth.uid() as mine,
      p.name as them_name,
      (select count(*) from driv_activity a where a.user_id = auth.uid() and a.day between c.start_day and c.end_day) as me_n,
      (select count(*) from driv_activity a where a.user_id = o.uid and a.day between c.start_day and c.end_day) as them_n,
      (select a.day from driv_activity a where a.user_id = auth.uid() and a.day between c.start_day and c.end_day
        order by a.day, a.created_at offset greatest(coalesce(c.goal, 1) - 1, 0) limit 1) as me_reached,
      (select a.day from driv_activity a where a.user_id = o.uid and a.day between c.start_day and c.end_day
        order by a.day, a.created_at offset greatest(coalesce(c.goal, 1) - 1, 0) limit 1) as them_reached
    from driv_challenges c
    cross join lateral (select case when c.created_by = auth.uid() then c.opponent else c.created_by end as uid) o
    join driv_profiles p on p.user_id = o.uid
    where auth.uid() in (c.created_by, c.opponent) and c.end_day >= current_date - 7
  ) r;
$$;

-- Ta bort en utmaning; båda sidor får göra det
create or replace function public.driv_challenge_delete(p_id bigint) returns void
language sql security definer set search_path = public as $$
  delete from driv_challenges where id = p_id and auth.uid() in (created_by, opponent);
$$;

revoke execute on function public.driv_board, public.driv_challenge_create, public.driv_challenges, public.driv_challenge_delete from public, anon;
grant execute on function public.driv_board, public.driv_challenge_create, public.driv_challenges, public.driv_challenge_delete to authenticated;
