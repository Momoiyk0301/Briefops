-- Waitlist table
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.waitlist enable row level security;
alter table public.waitlist force row level security;

drop policy if exists waitlist_insert on public.waitlist;
create policy waitlist_insert
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);

-- CGU accepted field on profiles
alter table public.profiles
  add column if not exists cgu_accepted boolean not null default false;

-- Export tracking fields
alter table public.briefing_exports
  add column if not exists generation_time_ms integer,
  add column if not exists pdf_size_mb numeric(10, 4),
  add column if not exists status text not null default 'success'
    check (status in ('success', 'error'));

-- Public link views tracking
create table if not exists public.public_link_views (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.public_links(id) on delete cascade,
  viewed_at timestamptz not null default timezone('utc', now()),
  user_agent text
);

create index if not exists idx_public_link_views_link_id on public.public_link_views(link_id);
create index if not exists idx_public_link_views_viewed_at on public.public_link_views(viewed_at desc);

alter table public.public_link_views enable row level security;
alter table public.public_link_views force row level security;

drop policy if exists public_link_views_insert on public.public_link_views;
create policy public_link_views_insert
  on public.public_link_views
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists public_link_views_select on public.public_link_views;
create policy public_link_views_select
  on public.public_link_views
  for select
  to authenticated
  using (
    exists (
      select 1 from public.public_links pl
      join public.briefings b on b.id = pl.briefing_id
      where pl.id = public_link_views.link_id
        and public.is_org_member(b.workspace_id)
    )
  );

grant insert on public.public_link_views to anon;
grant insert, select on public.public_link_views to authenticated;
grant insert on public.waitlist to anon;
grant insert on public.waitlist to authenticated;
