-- Roamlift: shared gym map, scan usage counter, and pro entitlement flag.
-- Every device signs in anonymously, so "authenticated" covers all app users.

create table public.gyms (
  place_id    text primary key,            -- Google Places id
  name        text not null check (char_length(name) between 1 and 200),
  address     text check (char_length(address) <= 400),
  lat         double precision,
  lng         double precision,
  created_at  timestamptz not null default now()
);

create table public.gym_kits (
  id          bigint generated always as identity primary key,
  place_id    text not null references public.gyms (place_id) on delete cascade,
  kit         text[] not null check (cardinality(kit) between 0 and 60),
  created_by  uuid default auth.uid() references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index gym_kits_place_recent on public.gym_kits (place_id, created_at desc);

-- Latest confirmed kit per place, plus how many times it has been scanned.
create view public.gym_kit_latest with (security_invoker = true) as
select distinct on (k.place_id)
  k.place_id,
  k.kit,
  k.created_at as last_scanned_at,
  count(*) over (partition by k.place_id) as scans
from public.gym_kits k
order by k.place_id, k.created_at desc;

create table public.profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  is_pro      boolean not null default false,  -- set by the RevenueCat webhook (phase 3)
  updated_at  timestamptz not null default now()
);

create table public.scan_events (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  images      int not null check (images between 1 and 10),
  items_found int not null default 0,
  created_at  timestamptz not null default now()
);
create index scan_events_user_month on public.scan_events (user_id, created_at desc);

alter table public.gyms enable row level security;
alter table public.gym_kits enable row level security;
alter table public.profiles enable row level security;
alter table public.scan_events enable row level security;

-- Anyone signed in can read the map and add to it. Nobody can edit or delete someone else's scan.
create policy "read gyms" on public.gyms for select to authenticated using (true);
create policy "add gyms" on public.gyms for insert to authenticated with check (true);
create policy "read kits" on public.gym_kits for select to authenticated using (true);
create policy "add own kit" on public.gym_kits for insert to authenticated with check (created_by = auth.uid());

-- Users can see their own entitlement and scan history. Writes happen only from edge functions (service role).
create policy "read own profile" on public.profiles for select to authenticated using (user_id = auth.uid());
create policy "read own scans" on public.scan_events for select to authenticated using (user_id = auth.uid());

grant select on public.gym_kit_latest to authenticated;
