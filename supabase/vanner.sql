-- Vänner i Driv. Kör i Supabase: SQL Editor → New query → klistra in → Run.
-- Det enda som delas med vänner är att ett pass är gjort, vilket pass och hur många övningar,
-- aldrig vikter, mat eller kroppsvikt. Tabellerna går inte att läsa direkt från appen; allt går
-- via funktionerna nedan, som själva kontrollerar vem som frågar (auth.uid()).

create table if not exists public.driv_profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  sharing boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.driv_friends (
  user_id uuid not null references auth.users (id) on delete cascade,
  friend_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

create table if not exists public.driv_activity (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  pass text not null check (char_length(pass) between 1 and 40),
  exercises int not null default 0 check (exercises between 0 and 100),
  created_at timestamptz not null default now(),
  unique (user_id, day, pass)
);

create table if not exists public.driv_kudos (
  activity_id bigint not null references public.driv_activity (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (activity_id, user_id)
);

-- Ingen direkt åtkomst: utan policyer stoppar radnivåsäkerheten all läsning och skrivning
alter table public.driv_profiles enable row level security;
alter table public.driv_friends enable row level security;
alter table public.driv_activity enable row level security;
alter table public.driv_kudos enable row level security;

-- Den egna profilen, eller null
create or replace function public.driv_profile_get() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('name', name, 'code', code, 'sharing', sharing)
  from driv_profiles where user_id = auth.uid();
$$;

-- Sparar namn och delning; en ny profil får en egen kod på sex tecken
create or replace function public.driv_profile_save(p_name text, p_sharing boolean) returns json
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if auth.uid() is null then raise exception 'Inte inloggad'; end if;
  if exists (select 1 from driv_profiles where user_id = auth.uid()) then
    update driv_profiles set name = trim(p_name), sharing = p_sharing where user_id = auth.uid();
  else
    loop
      c := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
      exit when not exists (select 1 from driv_profiles where code = c);
    end loop;
    insert into driv_profiles (user_id, name, code, sharing) values (auth.uid(), trim(p_name), c, p_sharing);
  end if;
  return driv_profile_get();
end $$;

-- Lägger till en vän med dennes kod; vänskapen gäller åt båda håll. Returnerar vännens namn.
create or replace function public.driv_add_friend(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare f driv_profiles;
begin
  if auth.uid() is null then raise exception 'Inte inloggad'; end if;
  if not exists (select 1 from driv_profiles where user_id = auth.uid()) then raise exception 'Skapa en profil först'; end if;
  select * into f from driv_profiles where code = upper(trim(p_code));
  if not found then raise exception 'Hittade ingen med den koden'; end if;
  if f.user_id = auth.uid() then raise exception 'Det är din egen kod'; end if;
  insert into driv_friends (user_id, friend_id) values (auth.uid(), f.user_id), (f.user_id, auth.uid())
    on conflict do nothing;
  return f.name;
end $$;

create or replace function public.driv_remove_friend(p_friend uuid) returns void
language sql security definer set search_path = public as $$
  delete from driv_friends where (user_id = auth.uid() and friend_id = p_friend)
    or (user_id = p_friend and friend_id = auth.uid());
$$;

create or replace function public.driv_friends() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('id', p.user_id, 'name', p.name) order by p.name), '[]'::json)
  from driv_friends f join driv_profiles p on p.user_id = f.friend_id
  where f.user_id = auth.uid();
$$;

-- Ett pass som sparats (p_done) läggs till, ett som öppnats igen tas bort.
-- Delar man inte med vänner sparas inget.
create or replace function public.driv_log_activity(p_day date, p_pass text, p_exercises int, p_done boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not exists (select 1 from driv_profiles where user_id = auth.uid() and sharing) then return; end if;
  if p_done then
    insert into driv_activity (user_id, day, pass, exercises) values (auth.uid(), p_day, left(p_pass, 40), least(greatest(p_exercises, 0), 100))
      on conflict (user_id, day, pass) do update set exercises = excluded.exercises;
  else
    delete from driv_activity where user_id = auth.uid() and day = p_day and pass = left(p_pass, 40);
  end if;
end $$;

-- De senaste två veckornas pass från en själv och vännerna som delar, med peppningar
create or replace function public.driv_feed() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(r order by r.day desc, r.created desc), '[]'::json) from (
    select a.id, a.day, a.pass, a.exercises, a.created_at as created, p.name,
      a.user_id = auth.uid() as mine,
      (select count(*) from driv_kudos k where k.activity_id = a.id) as kudos,
      exists (select 1 from driv_kudos k where k.activity_id = a.id and k.user_id = auth.uid()) as kudoed
    from driv_activity a join driv_profiles p on p.user_id = a.user_id
    where a.day >= current_date - 14 and p.sharing
      and (a.user_id = auth.uid() or a.user_id in (select friend_id from driv_friends where user_id = auth.uid()))
    order by a.day desc, a.created_at desc limit 30
  ) r;
$$;

-- Peppa ett väns pass, eller ta tillbaka peppningen
create or replace function public.driv_kudos(p_activity bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from driv_activity a where a.id = p_activity
      and a.user_id in (select friend_id from driv_friends where user_id = auth.uid())) then
    raise exception 'Inte en väns pass';
  end if;
  if exists (select 1 from driv_kudos where activity_id = p_activity and user_id = auth.uid()) then
    delete from driv_kudos where activity_id = p_activity and user_id = auth.uid();
  else
    insert into driv_kudos (activity_id, user_id) values (p_activity, auth.uid());
  end if;
end $$;

-- Raderar kontot och allt som hör till det: loggar, profil, vänner, pass och peppningar
create or replace function public.driv_delete_me() returns void
language sql security definer set search_path = public, auth as $$
  delete from auth.users where id = auth.uid();
$$;

-- Bara inloggade får anropa funktionerna
revoke execute on function public.driv_profile_get, public.driv_profile_save, public.driv_add_friend, public.driv_remove_friend,
  public.driv_friends, public.driv_log_activity, public.driv_feed, public.driv_kudos, public.driv_delete_me from public, anon;
grant execute on function public.driv_profile_get, public.driv_profile_save, public.driv_add_friend, public.driv_remove_friend,
  public.driv_friends, public.driv_log_activity, public.driv_feed, public.driv_kudos, public.driv_delete_me to authenticated;
