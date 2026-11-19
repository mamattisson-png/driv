-- Utmaningar och månadens topplista i Driv. Kör i Supabase: SQL Editor → New query → klistra in → Run.
-- Kräver att vanner.sql redan är kört. Kan köras flera gånger; en äldre version uppgraderas.
-- Precis som för vänner delas bara antal pass, aldrig vikter, mat eller kroppsvikt.
-- Tabellerna går inte att läsa direkt; allt går via funktionerna nedan.

create table if not exists public.driv_challenges (
  id bigint generated always as identity primary key,
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  opponent uuid references auth.users (id) on delete cascade,   -- bara från första versionen (två personer)
  kind text not null check (kind in ('forst', 'flest')),          -- först till ett antal pass, eller flest pass
  goal int check (goal between 1 and 100),
  start_day date not null,
  end_day date not null,
  created_at timestamptz not null default now(),
  check (end_day >= start_day and end_day - start_day <= 92),
  check (kind = 'flest' or goal is not null)
);
alter table public.driv_challenges alter column opponent drop not null;

-- Deltagarna i en utmaning (den som skapade den är också med)
create table if not exists public.driv_challenge_members (
  challenge_id bigint not null references public.driv_challenges (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (challenge_id, user_id)
);
-- Utmaningar från första versionen får sina två deltagare
insert into public.driv_challenge_members (challenge_id, user_id)
  select id, created_by from public.driv_challenges union select id, opponent from public.driv_challenges where opponent is not null
  on conflict do nothing;

alter table public.driv_challenges enable row level security;
alter table public.driv_challenge_members enable row level security;

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

-- Ny utmaning mot en eller flera vänner (högst 20). Högst tio pågående åt gången.
drop function if exists public.driv_challenge_create(uuid, text, int, date, date);
create or replace function public.driv_challenge_create(p_friends uuid[], p_kind text, p_goal int, p_start date, p_end date) returns bigint
language plpgsql security definer set search_path = public as $$
declare new_id bigint;
begin
  if auth.uid() is null then raise exception 'Inte inloggad'; end if;
  if coalesce(array_length(p_friends, 1), 0) = 0 then raise exception 'Välj minst en vän'; end if;
  if array_length(p_friends, 1) > 20 then raise exception 'Högst 20 vänner i en utmaning'; end if;
  if exists (select 1 from unnest(p_friends) f where f not in (select friend_id from driv_friends where user_id = auth.uid())) then
    raise exception 'Inte en vän';
  end if;
  if (select count(*) from driv_challenges c join driv_challenge_members m on m.challenge_id = c.id
      where m.user_id = auth.uid() and c.end_day >= current_date) >= 10 then
    raise exception 'Du har redan tio pågående utmaningar';
  end if;
  insert into driv_challenges (created_by, kind, goal, start_day, end_day)
    values (auth.uid(), p_kind, case when p_kind = 'forst' then p_goal end, p_start, p_end)
    returning id into new_id;
  insert into driv_challenge_members (challenge_id, user_id)
    select new_id, u from (select auth.uid() as u union select unnest(p_friends)) x on conflict do nothing;
  return new_id;
end $$;

-- Ens utmaningar (pågående och de som slutade senaste veckan). Varje deltagare får antal pass
-- och dagen då hen nådde målet (för "först till").
create or replace function public.driv_challenges() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(r order by r.end_day, r.id), '[]'::json) from (
    select c.id, c.kind, c.goal, c.start_day, c.end_day, c.created_by = auth.uid() as mine,
      (select json_agg(json_build_object('name', p.name, 'me', m.user_id = auth.uid(),
          'n', (select count(*) from driv_activity a where a.user_id = m.user_id and a.day between c.start_day and c.end_day),
          'reached', (select a.day from driv_activity a where a.user_id = m.user_id and a.day between c.start_day and c.end_day
            order by a.day, a.created_at offset greatest(coalesce(c.goal, 1) - 1, 0) limit 1)) order by p.name)
        from driv_challenge_members m join driv_profiles p on p.user_id = m.user_id
        where m.challenge_id = c.id) as people
    from driv_challenges c
    where c.end_day >= current_date - 7
      and exists (select 1 from driv_challenge_members m where m.challenge_id = c.id and m.user_id = auth.uid())
  ) r;
$$;

-- Den som skapade utmaningen tar bort den; en deltagare lämnar den. Färre än två kvar tar bort den.
create or replace function public.driv_challenge_delete(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from driv_challenges where id = p_id and created_by = auth.uid()) then
    delete from driv_challenges where id = p_id;
  else
    delete from driv_challenge_members where challenge_id = p_id and user_id = auth.uid();
    if (select count(*) from driv_challenge_members where challenge_id = p_id) < 2 then delete from driv_challenges where id = p_id; end if;
  end if;
end $$;

revoke execute on function public.driv_board, public.driv_challenge_create, public.driv_challenges, public.driv_challenge_delete from public, anon;
grant execute on function public.driv_board, public.driv_challenge_create, public.driv_challenges, public.driv_challenge_delete to authenticated;
