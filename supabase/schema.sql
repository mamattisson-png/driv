-- Tabell för Drivs data. Kör i Supabase: SQL Editor → New query → klistra in → Run.
-- Varje användare har ett dokument med inställningar och ett per månad med loggen.

create table if not exists public.driv_docs (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- Radnivåsäkerhet: man kan bara läsa och ändra sina egna rader
alter table public.driv_docs enable row level security;

create policy "Läsa egna dokument" on public.driv_docs
  for select using (auth.uid() = user_id);
create policy "Skapa egna dokument" on public.driv_docs
  for insert with check (auth.uid() = user_id);
create policy "Ändra egna dokument" on public.driv_docs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Ta bort egna dokument" on public.driv_docs
  for delete using (auth.uid() = user_id);
