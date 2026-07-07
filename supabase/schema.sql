-- FakeCraving schema
-- Run against a fresh Supabase (Postgres) project.

create extension if not exists pgcrypto;

-- Restaurants (seeded once from merged/generated data)
create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cuisine text,
  city text,
  price_range text,
  rating numeric,
  image_emoji text,
  fake_eta_min int,
  created_at timestamptz default now()
);

-- Added after the initial schema: real photo path, source area, and
-- restaurant-level add-on suggestions. `add column if not exists` keeps this
-- script safe to re-run against a project that already has the older schema.
alter table restaurants add column if not exists area text;
alter table restaurants add column if not exists image text;
alter table restaurants add column if not exists add_ons jsonb;

-- Dishes
create table if not exists dishes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  name text not null,
  price numeric,
  description text,
  emoji text,
  created_at timestamptz default now()
);

-- Added after the initial schema: optional Half/Full size variants, and a
-- real photo URL (Pexels/Foodish, fetched per unique dish name).
alter table dishes add column if not exists variants jsonb;
alter table dishes add column if not exists image_url text;

-- Orders (fake orders placed by users)
-- restaurant_id intentionally has NO foreign key: the app serves its
-- restaurant/dish catalog from a bundled static JSON (public/data/restaurants.json),
-- not from the restaurants/dishes tables below, so those ids never need to
-- exist in Supabase for an order to be placeable. The restaurants/dishes
-- tables exist to mirror the schema in the requirements doc and are
-- populated only if/when you choose to run supabase/seed.sql.
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  session_id text not null, -- anonymous, from browser
  restaurant_id uuid,
  restaurant_name text,
  dish_ids uuid[],
  items jsonb, -- [{ dish_id, name, price, qty }]
  total_amount numeric,
  city text,
  created_at timestamptz default now()
);

create index if not exists orders_session_id_idx on orders (session_id);

-- Global stats (for live counter)
create table if not exists stats (
  key text primary key,
  value bigint default 0
);

insert into stats (key, value)
values ('total_orders', 0)
on conflict (key) do nothing;

-- Atomically increments the global order counter; called via RPC after
-- an order insert so the client never has to read-then-write the counter.
-- security definer + fixed search_path: anon can only ever bump this one
-- counter by exactly 1 per call, never write to `stats` directly (no
-- update policy is granted on the table itself).
create or replace function increment_total_orders()
returns bigint
language sql
security definer
set search_path = public
as $$
  update stats set value = value + 1 where key = 'total_orders'
  returning value;
$$;

-- Row Level Security: no auth, so allow anonymous read/insert on the
-- public-facing tables. Anonymous session_id is self-reported, not a
-- security boundary — this app has no sensitive data.
alter table restaurants enable row level security;
alter table dishes enable row level security;
alter table orders enable row level security;
alter table stats enable row level security;

drop policy if exists "public read restaurants" on restaurants;
create policy "public read restaurants" on restaurants for select using (true);

drop policy if exists "public read dishes" on dishes;
create policy "public read dishes" on dishes for select using (true);

drop policy if exists "public read stats" on stats;
create policy "public read stats" on stats for select using (true);

drop policy if exists "public insert orders" on orders;
create policy "public insert orders" on orders for insert with check (true);

drop policy if exists "public read own orders" on orders;
create policy "public read own orders" on orders for select using (true);
