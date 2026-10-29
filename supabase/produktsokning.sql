-- Delad cache och sökbudget. Innehåller bara publika produktsökningar, ingen dagbok.
-- Körs en gång före deployment av driv-food-search. Bara service_role har åtkomst.
create schema if not exists driv_search_private;
revoke all on schema driv_search_private from public, anon, authenticated;
grant usage on schema driv_search_private to service_role;
create table if not exists driv_search_private.cache (
  query text primary key check (length(query) between 2 and 120),
  hits jsonb not null check (jsonb_typeof(hits) = 'array' and jsonb_array_length(hits) <= 15),
  expires_at timestamptz not null
);
create index if not exists driv_search_cache_expiry on driv_search_private.cache(expires_at);
create table if not exists driv_search_private.budget (
  id integer primary key check (id = 1),
  next_at timestamptz not null default '-infinity',
  day date not null default current_date,
  used integer not null default 0
);
insert into driv_search_private.budget(id) values (1) on conflict do nothing;
alter table driv_search_private.cache enable row level security;
alter table driv_search_private.budget enable row level security;
revoke all on all tables in schema driv_search_private from public, anon, authenticated;
grant select, insert, update, delete on all tables in schema driv_search_private to service_role;

create or replace function public.driv_food_search_reserve(p_query text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result jsonb; b driv_search_private.budget%rowtype; t timestamptz := clock_timestamp();
begin
  if length(p_query) not between 2 and 120 then raise exception 'Invalid query'; end if;
  select hits into result from driv_search_private.cache where query = p_query and expires_at > t;
  if found then return jsonb_build_object('status','cached','hits',result); end if;
  select * into b from driv_search_private.budget where id = 1 for update;
  if b.day <> (t at time zone 'UTC')::date then b.used := 0; end if;
  if b.used >= 1500 then return jsonb_build_object('status','limited','retry_after',3600); end if;
  if b.next_at > t then return jsonb_build_object('status','limited','retry_after',greatest(1,ceil(extract(epoch from b.next_at-t)))); end if;
  update driv_search_private.budget set next_at=t+interval '6 seconds',day=(t at time zone 'UTC')::date,used=b.used+1 where id=1;
  delete from driv_search_private.cache where expires_at <= t;
  return jsonb_build_object('status','fetch');
end;
$$;
create or replace function public.driv_food_search_store(p_query text, p_hits jsonb)
returns void language sql security invoker set search_path = '' as $$
  insert into driv_search_private.cache(query,hits,expires_at)
  values(p_query,p_hits,now()+interval '24 hours')
  on conflict(query) do update set hits=excluded.hits,expires_at=excluded.expires_at;
$$;
revoke all on function public.driv_food_search_reserve(text) from public, anon, authenticated;
revoke all on function public.driv_food_search_store(text,jsonb) from public, anon, authenticated;
grant execute on function public.driv_food_search_reserve(text) to service_role;
grant execute on function public.driv_food_search_store(text,jsonb) to service_role;
