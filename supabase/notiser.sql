-- Notiser för Driv. Kör i Supabase: SQL Editor → New query → klistra in → Run.
-- Kräver att vanner.sql redan är körd (peppningar blir notiser).
-- Telefonernas prenumerationer och kön med notiser ligger här; ingen kan läsa dem via appen,
-- bara via funktionerna nedan och Edge Function driv-push (som kör med service-nyckeln på servern).

create table if not exists public.driv_push (
  endpoint text primary key check (char_length(endpoint) between 10 and 1000),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  p256dh text not null check (char_length(p256dh) < 200),
  auth text not null check (char_length(auth) < 100),
  tz text not null default 'Europe/Stockholm' check (char_length(tz) < 60),
  remind_time text not null default '18:00' check (remind_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  remind boolean not null default true,
  kudos boolean not null default true,
  last_daily date,
  created_at timestamptz not null default now()
);
alter table public.driv_push enable row level security;

create table if not exists public.driv_push_queue (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
alter table public.driv_push_queue enable row level security;

-- Sparar eller uppdaterar den här telefonens prenumeration och inställningar
create or replace function public.driv_push_save(p_endpoint text, p_p256dh text, p_auth text, p_tz text,
  p_time text, p_remind boolean, p_kudos boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Inte inloggad'; end if;
  insert into driv_push (endpoint, user_id, p256dh, auth, tz, remind_time, remind, kudos)
  values (p_endpoint, auth.uid(), p_p256dh, p_auth, coalesce(nullif(p_tz, ''), 'Europe/Stockholm'), p_time, p_remind, p_kudos)
  on conflict (endpoint) do update set user_id = auth.uid(), p256dh = excluded.p256dh, auth = excluded.auth,
    tz = excluded.tz, remind_time = excluded.remind_time, remind = excluded.remind, kudos = excluded.kudos,
    last_daily = case when driv_push.remind_time = excluded.remind_time then driv_push.last_daily end;
end $$;

create or replace function public.driv_push_delete(p_endpoint text) returns void
language sql security definer set search_path = public as $$
  delete from driv_push where endpoint = p_endpoint and user_id = auth.uid();
$$;

revoke execute on function public.driv_push_save, public.driv_push_delete from public, anon;
grant execute on function public.driv_push_save, public.driv_push_delete to authenticated;

-- En peppning blir en notis till den som körde passet
create or replace function public.driv_kudos_notify() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid; what text; who text;
begin
  select user_id, pass into owner, what from driv_activity where id = new.activity_id;
  select name into who from driv_profiles where user_id = new.user_id;
  if owner is not null and owner <> new.user_id then
    insert into driv_push_queue (user_id, title, body)
    values (owner, coalesce(who, 'En vän') || ' peppade dig 👏', 'För ditt pass ' || what || '.');
  end if;
  return new;
end $$;
revoke execute on function public.driv_kudos_notify from public, anon, authenticated;
drop trigger if exists driv_kudos_notify on public.driv_kudos;
create trigger driv_kudos_notify after insert on public.driv_kudos
  for each row execute function public.driv_kudos_notify();

-- ---------- Schema: kör funktionen var tionde minut ----------
-- Kör den här delen först när Edge Function driv-push är publicerad.
-- Byt BYT-MIG mot samma hemliga ord som du sparat som CRON_SECRET bland funktionens secrets.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('driv-push', '*/10 * * * *', $cron$
  select net.http_post(
    url := 'https://zepugwoostphckstyrqf.supabase.co/functions/v1/driv-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-driv-cron', 'BYT-MIG'),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000);   -- en kall start av funktionen kan ta mer än standardens 5 sekunder
$cron$);
