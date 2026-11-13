-- Profiler i Driv: profilbild och statistik. Kör efter vanner.sql, i Supabase: SQL Editor → New query → klistra in → Run.
-- Profilbilden är ett litet foto (fyrkantigt, förminskat i telefonen, under 60 kB) som sparas i profilraden.
-- Den syns bara för en själv och för vännerna, och raderas med kontot (raden tas bort när kontot raderas).
-- Statistiken räknas på de pass som delats med vänner: aldrig vikter, mat eller kroppsvikt.
-- Allt går via funktioner som själva kontrollerar vem som frågar (auth.uid()); tabellerna går inte att läsa direkt.

alter table public.driv_profiles add column if not exists photo text
  check (photo is null or (photo like 'data:image/jpeg;base64,%' and char_length(photo) <= 60000));

-- Den egna profilen, nu med profilbild och när den skapades
create or replace function public.driv_profile_get() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('name', name, 'code', code, 'sharing', sharing, 'photo', photo, 'since', created_at::date)
  from driv_profiles where user_id = auth.uid();
$$;

-- Spara eller ta bort (null) den egna profilbilden
create or replace function public.driv_photo_save(p_photo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Inte inloggad'; end if;
  update driv_profiles set photo = p_photo where user_id = auth.uid();
end $$;

-- Vännerna, nu med profilbild
create or replace function public.driv_friends() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('id', p.user_id, 'name', p.name, 'photo', p.photo,
      'last', (select max(a.day) from driv_activity a where a.user_id = p.user_id and p.sharing),
      'week', (select count(*) from driv_activity a where a.user_id = p.user_id and p.sharing and a.day >= date_trunc('week', current_date)::date)
    ) order by p.name), '[]'::json)
  from driv_friends f join driv_profiles p on p.user_id = f.friend_id
  where f.user_id = auth.uid();
$$;

-- Flödet, nu med vems pass det är (uid), så att rätt profilbild visas
create or replace function public.driv_feed() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(r order by r.day desc, r.created desc), '[]'::json) from (
    select a.id, a.day, a.pass, a.exercises, a.created_at as created, p.name, a.user_id as uid,
      a.user_id = auth.uid() as mine,
      (select count(*) from driv_kudos k where k.activity_id = a.id) as kudos,
      exists (select 1 from driv_kudos k where k.activity_id = a.id and k.user_id = auth.uid()) as kudoed
    from driv_activity a join driv_profiles p on p.user_id = a.user_id
    where a.day >= current_date - 14 and p.sharing
      and (a.user_id = auth.uid() or a.user_id in (select friend_id from driv_friends where user_id = auth.uid()))
    order by a.day desc, a.created_at desc limit 300
  ) r;
$$;

-- En väns profil: pass den här månaden, totalt, veckor i rad med minst ett pass, vanligaste passet och de senaste passen.
-- Bara för en själv eller en vän som delar.
create or replace function public.driv_profile_stats(p_user uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare ok boolean; wk date; n int := 0;
begin
  ok := p_user = auth.uid() or (exists (select 1 from driv_friends where user_id = auth.uid() and friend_id = p_user)
    and exists (select 1 from driv_profiles where user_id = p_user and sharing));
  if not ok then return null; end if;
  -- Veckor i rad: från denna vecka (eller förra, om inget gjorts än) och bakåt
  wk := date_trunc('week', current_date)::date;
  if not exists (select 1 from driv_activity where user_id = p_user and day >= wk) then wk := wk - 7; end if;
  while n < 260 and exists (select 1 from driv_activity where user_id = p_user and day >= wk and day < wk + 7) loop
    n := n + 1; wk := wk - 7;
  end loop;
  return json_build_object(
    'month', (select count(*) from driv_activity where user_id = p_user and day >= date_trunc('month', current_date)::date),
    'total', (select count(*) from driv_activity where user_id = p_user),
    'weeks', n,
    'top', (select pass from driv_activity where user_id = p_user group by pass order by count(*) desc, max(day) desc limit 1),
    'recent', (select coalesce(json_agg(json_build_object('id', id, 'day', day, 'pass', pass,
        'kudos', (select count(*) from driv_kudos k where k.activity_id = r.id),
        'kudoed', exists (select 1 from driv_kudos k where k.activity_id = r.id and k.user_id = auth.uid())) order by day desc, created_at desc), '[]'::json)
      from (select * from driv_activity where user_id = p_user order by day desc, created_at desc limit 5) r),
    'since', (select created_at::date from driv_profiles where user_id = p_user));
end $$;

revoke execute on function public.driv_photo_save, public.driv_profile_stats from public, anon;
grant execute on function public.driv_photo_save, public.driv_profile_stats to authenticated;
