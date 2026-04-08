create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null unique,
  description text,

  stripe_product_id text,
  stripe_price_id text,

  price_amount integer not null default 0,
  price_currency text not null default 'eur',
  billing_interval text not null default 'month',

  features jsonb not null default '[]'::jsonb,

  is_active boolean not null default true,
  is_highlighted boolean not null default false,

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null unique,
  description text,

  stripe_product_id text,
  stripe_price_id text,

  price_amount integer not null default 0,
  price_currency text not null default 'eur',
  billing_interval text not null default 'month',

  features jsonb not null default '[]'::jsonb,

  is_active boolean not null default true,
  is_highlighted boolean not null default false,

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.products enable row level security;

create policy "products_select_authenticated"
on public.products
for select
to authenticated
using (is_active = true);

create policy "products_insert_service_role"
on public.products
for insert
to service_role
with check (true);

create policy "products_update_service_role"
on public.products
for update
to service_role
using (true)
with check (true);

create policy "products_delete_service_role"
on public.products
for delete
to service_role
using (true);