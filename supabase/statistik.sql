-- Anonym statistik och felrapporter i Driv. Kör i Supabase: SQL Editor → New query → klistra in → Run.
-- Inget sparas om vem som gjorde något: inget användar-id, ingen e-post, ingen IP-adress.
-- Händelserna är några få fasta namn (t.ex. "pass_klart"), och felen är meddelande och var i koden.
-- Tabellerna går inte att läsa från appen. Bara de som står i driv_admins kan se sammanställningen.

create table if not exists public.driv_events (
  id bigint generated always as identity primary key,
  event text not null check (event in ('aktiv_vecka', 'pass_klart', 'aktivitet_loggad', 'dailys_klara', 'mat_loggad',
    'skanner', 'recept_sparat', 'utmaning_skapad')),
  platform text not null default '' check (char_length(platform) <= 20),
  created_at timestamptz not null default now()
);
create index if not exists driv_events_created on public.driv_events (created_at);

create table if not exists public.driv_errors (
  id bigint generated always as identity primary key,
  message text not null check (char_length(message) <= 300),
  source text not null default '' check (char_length(source) <= 200),
  page text not null default '' check (char_length(page) <= 40),
  platform text not null default '' check (char_length(platform) <= 20),
  created_at timestamptz not null default now()
);
create index if not exists driv_errors_created on public.driv_errors (created_at);

-- Vilka som får se statistiken. Lägg till dig själv efter körningen, se längst ner.
create table if not exists public.driv_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.driv_events enable row level security;
alter table public.driv_errors enable row level security;
alter table public.driv_admins enable row level security;

-- En händelse. Högst 600 i minuten totalt; äldre än 400 dagar städas bort då och då.
create or replace function public.driv_track(p_event text, p_platform text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from driv_events where created_at > now() - interval '1 minute') >= 600 then return; end if;
  insert into driv_events (event, platform) values (p_event, left(coalesce(p_platform, ''), 20));
  if random() < 0.002 then delete from driv_events where created_at < now() - interval '400 days'; end if;
exception when check_violation then return;   -- okänt namn: ignoreras
end $$;

-- Ett fel. Högst 60 i minuten totalt; äldre än 90 dagar städas bort då och då.
create or replace function public.driv_report_error(p_message text, p_source text, p_page text, p_platform text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from driv_errors where created_at > now() - interval '1 minute') >= 60 then return; end if;
  insert into driv_errors (message, source, page, platform)
    values (left(coalesce(p_message, ''), 300), left(coalesce(p_source, ''), 200), left(coalesce(p_page, ''), 40), left(coalesce(p_platform, ''), 20));
  if random() < 0.01 then delete from driv_errors where created_at < now() - interval '90 days'; end if;
end $$;

create or replace function public.driv_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from driv_admins where user_id = auth.uid());
$$;

-- Sammanställningen: aktiva enheter per vecka (12 veckor), händelser senaste 7 och 30 dagarna, och de senaste felen
create or replace function public.driv_stats() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from driv_admins where user_id = auth.uid()) then raise exception 'Ingen behörighet'; end if;
  return json_build_object(
    'weeks', (select coalesce(json_agg(w order by w.week), '[]'::json) from (
        select date_trunc('week', created_at)::date as week, count(*) as active
        from driv_events where event = 'aktiv_vecka' and created_at > date_trunc('week', now()) - interval '11 weeks'
        group by 1) w),
    'events', (select coalesce(json_agg(e order by e.d30 desc), '[]'::json) from (
        select event, count(*) filter (where created_at > now() - interval '7 days') as d7, count(*) as d30
        from driv_events where created_at > now() - interval '30 days' and event <> 'aktiv_vecka' group by event) e),
    'platforms', (select coalesce(json_agg(p order by p.n desc), '[]'::json) from (
        select platform, count(*) as n from driv_events
        where event = 'aktiv_vecka' and created_at > date_trunc('week', now()) - interval '3 weeks' group by platform) p),
    'errors7', (select count(*) from driv_errors where created_at > now() - interval '7 days'),
    'errors', (select coalesce(json_agg(x order by x.last desc), '[]'::json) from (
        select message, source, page, count(*) as n, max(created_at) as last, string_agg(distinct platform, ', ') as platforms
        from driv_errors where created_at > now() - interval '30 days' group by message, source, page
        order by max(created_at) desc limit 20) x)
  );
end $$;

revoke execute on function public.driv_track, public.driv_report_error, public.driv_is_admin, public.driv_stats from public;
revoke execute on function public.driv_is_admin, public.driv_stats from anon;   -- bara inloggade (och sedan bara admin)
grant execute on function public.driv_track, public.driv_report_error to anon, authenticated;
grant execute on function public.driv_is_admin, public.driv_stats to authenticated;

-- Gör dig själv till admin (byt e-postadressen mot din egen och kör raden):
-- insert into public.driv_admins (user_id) select id from auth.users where email = 'din@epost.se' on conflict do nothing;
