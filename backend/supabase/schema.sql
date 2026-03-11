create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.request_header(header_name text)
returns text
language sql
stable
as $$
  with raw as (
    select nullif(current_setting('request.headers', true), '') as headers
  )
  select case
    when headers is null then null
    else headers::jsonb ->> lower(header_name)
  end
  from raw;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  plan text not null default 'free' check (plan in ('free', 'starter', 'plus', 'pro')),
  onboarding_step text not null default 'workspace' check (onboarding_step in ('workspace', 'products', 'demo', 'done')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  subscription_name text,
  subscription_status text,
  current_period_end timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check check (plan in ('free', 'starter', 'plus', 'pro'));

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null default 'Belgium',
  team_size integer,
  vat_number text,
  owner_id uuid not null unique references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.workspaces
  drop constraint if exists workspaces_team_size_check;
alter table public.workspaces
  add constraint workspaces_team_size_check check (team_size is null or team_size > 0);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  plan_name text,
  stripe_price_id text,
  stripe_product_id text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, user_id),
  unique (user_id)
);

create table if not exists public.briefings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  event_date date,
  location_text text,
  pdf_path text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  version integer not null default 1,
  icon text not null default 'box',
  category text not null default 'general',
  enabled boolean not null default true,
  default_layout jsonb not null default '{}'::jsonb,
  default_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (type)
);

create table if not exists public.workspace_modules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, module_id)
);

create table if not exists public.briefing_modules (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid not null references public.briefings(id) on delete cascade,
  module_id uuid references public.modules(id) on delete set null,
  module_key text not null,
  enabled boolean not null default true,
  data_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (briefing_id, module_key)
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  briefing_id uuid not null references public.briefings(id) on delete cascade,
  full_name text not null,
  role text not null default 'staff',
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.briefing_exports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  briefing_id uuid not null references public.briefings(id) on delete cascade,
  version integer not null check (version > 0),
  file_path text not null,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid not null references public.profiles(id) on delete restrict,
  unique (briefing_id, version),
  unique (file_path)
);

create table if not exists public.public_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default gen_random_uuid()::text,
  briefing_id uuid not null references public.briefings(id) on delete cascade,
  resource_type text not null default 'pdf',
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  month_start date not null,
  pdf_exports integer not null default 0 check (pdf_exports >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, month_start)
);

create index if not exists idx_memberships_workspace_id on public.memberships(workspace_id);
create index if not exists idx_memberships_user_id on public.memberships(user_id);
create index if not exists idx_memberships_workspace_role on public.memberships(workspace_id, role);

create index if not exists idx_briefings_workspace_id on public.briefings(workspace_id);
create index if not exists idx_briefings_workspace_event_date on public.briefings(workspace_id, event_date);
create index if not exists idx_modules_registry_type on public.modules(type);
create index if not exists idx_modules_registry_enabled on public.modules(enabled);
create index if not exists idx_workspace_modules_workspace_id on public.workspace_modules(workspace_id);
create index if not exists idx_workspace_modules_module_id on public.workspace_modules(module_id);

create index if not exists idx_modules_briefing_id on public.briefing_modules(briefing_id);
create index if not exists idx_modules_briefing_module_id on public.briefing_modules(module_id);
create index if not exists idx_modules_data_json_gin on public.briefing_modules using gin (data_json);
create index if not exists idx_staff_workspace_id on public.staff(workspace_id);
create index if not exists idx_staff_briefing_id on public.staff(briefing_id);
create index if not exists idx_briefing_exports_workspace_id on public.briefing_exports(workspace_id);
create index if not exists idx_briefing_exports_briefing_id on public.briefing_exports(briefing_id);
create index if not exists idx_briefing_exports_created_at on public.briefing_exports(created_at desc);

create index if not exists idx_public_links_token on public.public_links(token);
create index if not exists idx_public_links_briefing_id on public.public_links(briefing_id);
create index if not exists idx_public_links_resource_type on public.public_links(resource_type);
create index if not exists idx_public_links_briefing_resource on public.public_links(briefing_id, resource_type);
create index if not exists idx_public_links_expires_at on public.public_links(expires_at);
create index if not exists idx_public_links_created_by on public.public_links(created_by);

create index if not exists idx_usage_user_month on public.usage_counters(user_id, month_start);

create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.workspace_id = p_workspace_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(p_workspace_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.workspace_id = p_workspace_id
      and m.user_id = auth.uid()
      and m.role = any (p_roles)
  );
$$;

create or replace function public.shares_workspace_with_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships me
    join public.memberships other
      on other.workspace_id = me.workspace_id
    where me.user_id = auth.uid()
      and other.user_id = p_user_id
  );
$$;

create or replace function public.can_read_briefing_via_token(p_briefing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.public_links pl
    where pl.briefing_id = p_briefing_id
      and pl.token = public.request_header('x-briefing-token')
      and pl.revoked_at is null
      and (pl.expires_at is null or pl.expires_at > now())
  );
$$;

create or replace function public.consume_pdf_export(p_user_id uuid, p_free_limit integer default 3)
returns table (allowed boolean, used integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_month_start date;
  v_current integer;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'forbidden';
  end if;

  select plan into v_plan
  from public.profiles
  where id = p_user_id;

  if v_plan is null then
    raise exception 'profile_not_found';
  end if;

  if v_plan = 'pro' then
    return query select true, 0;
    return;
  end if;

  v_month_start := date_trunc('month', timezone('utc', now()))::date;

  insert into public.usage_counters (user_id, month_start, pdf_exports)
  values (p_user_id, v_month_start, 0)
  on conflict (user_id, month_start) do nothing;

  update public.usage_counters
  set pdf_exports = pdf_exports + 1,
      updated_at = timezone('utc', now())
  where user_id = p_user_id
    and month_start = v_month_start
    and pdf_exports < p_free_limit
  returning pdf_exports into v_current;

  if v_current is null then
    select pdf_exports into v_current
    from public.usage_counters
    where user_id = p_user_id
      and month_start = v_month_start;

    return query select false, coalesce(v_current, p_free_limit);
    return;
  end if;

  return query select true, v_current;
end;
$$;

create or replace function public.sync_staff_workspace_id()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  select b.workspace_id into new.workspace_id
  from public.briefings b
  where b.id = new.briefing_id;

  if new.workspace_id is null then
    raise exception 'invalid briefing_id for staff';
  end if;

  return new;
end;
$$;


drop trigger if exists trg_briefings_updated_at on public.briefings;
create trigger trg_briefings_updated_at
before update on public.briefings
for each row
execute function public.set_updated_at();

drop trigger if exists trg_modules_updated_at on public.modules;
create trigger trg_modules_updated_at
before update on public.modules
for each row
execute function public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_briefing_modules_updated_at on public.briefing_modules;
create trigger trg_briefing_modules_updated_at
before update on public.briefing_modules
for each row
execute function public.set_updated_at();

drop trigger if exists trg_staff_updated_at on public.staff;
create trigger trg_staff_updated_at
before update on public.staff
for each row
execute function public.set_updated_at();

drop trigger if exists trg_staff_sync_org_id on public.staff;
drop trigger if exists trg_staff_sync_workspace_id on public.staff;
create trigger trg_staff_sync_workspace_id
before insert or update of briefing_id on public.staff
for each row
execute function public.sync_staff_workspace_id();

drop trigger if exists trg_usage_counters_updated_at on public.usage_counters;
create trigger trg_usage_counters_updated_at
before update on public.usage_counters
for each row
execute function public.set_updated_at();

grant usage on schema public to anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select on public.briefings to anon;
grant select on public.briefing_modules to anon;
grant select on public.public_links to anon;
grant select, insert, update, delete on public.workspaces to authenticated;
grant select, insert, update, delete on public.memberships to authenticated;
grant select, insert, update, delete on public.briefings to authenticated;
grant select on public.modules to authenticated;
grant select, insert, update, delete on public.workspace_modules to authenticated;
grant select, insert, update, delete on public.briefing_modules to authenticated;
grant select, insert, update, delete on public.staff to authenticated;
grant select, insert on public.briefing_exports to authenticated;
grant select, insert, update, delete on public.public_links to authenticated;
grant select on public.usage_counters to authenticated;
grant execute on function public.consume_pdf_export(uuid, integer) to authenticated;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.memberships enable row level security;
alter table public.briefings enable row level security;
alter table public.modules enable row level security;
alter table public.workspace_modules enable row level security;
alter table public.briefing_modules enable row level security;
alter table public.staff enable row level security;
alter table public.briefing_exports enable row level security;
alter table public.public_links enable row level security;
alter table public.usage_counters enable row level security;

alter table public.profiles force row level security;
alter table public.workspaces force row level security;
alter table public.memberships force row level security;
alter table public.briefings force row level security;
alter table public.modules force row level security;
alter table public.workspace_modules force row level security;
alter table public.briefing_modules force row level security;
alter table public.staff force row level security;
alter table public.briefing_exports force row level security;
alter table public.public_links force row level security;
alter table public.usage_counters force row level security;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;

drop policy if exists orgs_select on public.workspaces;
drop policy if exists orgs_insert on public.workspaces;
drop policy if exists orgs_update on public.workspaces;
drop policy if exists orgs_delete on public.workspaces;

drop policy if exists memberships_select on public.memberships;
drop policy if exists memberships_insert on public.memberships;
drop policy if exists memberships_update on public.memberships;
drop policy if exists memberships_delete on public.memberships;

drop policy if exists briefings_select on public.briefings;
drop policy if exists briefings_select_invite on public.briefings;
drop policy if exists briefings_insert on public.briefings;
drop policy if exists briefings_update on public.briefings;
drop policy if exists briefings_delete on public.briefings;

drop policy if exists modules_registry_select on public.modules;
drop policy if exists modules_registry_insert on public.modules;
drop policy if exists modules_registry_update on public.modules;
drop policy if exists modules_registry_delete on public.modules;

drop policy if exists workspace_modules_select on public.workspace_modules;
drop policy if exists workspace_modules_insert on public.workspace_modules;
drop policy if exists workspace_modules_update on public.workspace_modules;
drop policy if exists workspace_modules_delete on public.workspace_modules;

drop policy if exists modules_select on public.briefing_modules;
drop policy if exists modules_select_invite on public.briefing_modules;
drop policy if exists modules_insert on public.briefing_modules;
drop policy if exists modules_update on public.briefing_modules;
drop policy if exists modules_delete on public.briefing_modules;

drop policy if exists staff_select on public.staff;
drop policy if exists staff_insert on public.staff;
drop policy if exists staff_update on public.staff;
drop policy if exists staff_delete on public.staff;

drop policy if exists briefing_exports_select on public.briefing_exports;
drop policy if exists briefing_exports_insert on public.briefing_exports;

drop policy if exists public_links_select_token_only on public.public_links;
drop policy if exists public_links_insert_own on public.public_links;
drop policy if exists public_links_update_own on public.public_links;
drop policy if exists public_links_delete_own on public.public_links;
drop policy if exists public_links_select_own on public.public_links;

drop policy if exists usage_select_own on public.usage_counters;

create policy profiles_select
on public.profiles
for select
to authenticated
using (
  id = auth.uid() or public.shares_workspace_with_user(id)
);

create policy profiles_insert
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy profiles_update
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy orgs_select
on public.workspaces
for select
to authenticated
using (public.is_workspace_member(id));

create policy orgs_insert
on public.workspaces
for insert
to authenticated
with check (owner_id = auth.uid());

create policy orgs_update
on public.workspaces
for update
to authenticated
using (public.has_workspace_role(id, array['owner','admin']))
with check (public.has_workspace_role(id, array['owner','admin']));

create policy orgs_delete
on public.workspaces
for delete
to authenticated
using (public.has_workspace_role(id, array['owner','admin']));

create policy memberships_select
on public.memberships
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy memberships_insert
on public.memberships
for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner','admin']));

create policy memberships_update
on public.memberships
for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner','admin']))
with check (public.has_workspace_role(workspace_id, array['owner','admin']));

create policy memberships_delete
on public.memberships
for delete
to authenticated
using (public.has_workspace_role(workspace_id, array['owner','admin']));

create policy briefings_select
on public.briefings
for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
);

create policy briefings_select_invite
on public.briefings
for select
to anon
using (
  public.can_read_briefing_via_token(id)
);

create policy briefings_insert
on public.briefings
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.has_workspace_role(workspace_id, array['owner','admin'])
);

create policy briefings_update
on public.briefings
for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner','admin','member']))
with check (public.has_workspace_role(workspace_id, array['owner','admin','member']));

create policy briefings_delete
on public.briefings
for delete
to authenticated
using (public.has_workspace_role(workspace_id, array['owner','admin']));

create policy modules_registry_select
on public.modules
for select
to authenticated
using (true);

create policy workspace_modules_select
on public.workspace_modules
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy workspace_modules_insert
on public.workspace_modules
for insert
to authenticated
with check (public.has_workspace_role(workspace_id, array['owner','admin']));

create policy workspace_modules_update
on public.workspace_modules
for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner','admin']))
with check (public.has_workspace_role(workspace_id, array['owner','admin']));

create policy workspace_modules_delete
on public.workspace_modules
for delete
to authenticated
using (public.has_workspace_role(workspace_id, array['owner','admin']));

create policy modules_select
on public.briefing_modules
for select
to authenticated
using (
  exists (
    select 1
    from public.briefings b
    where b.id = briefing_modules.briefing_id
      and public.is_workspace_member(b.workspace_id)
  )
);

create policy modules_select_invite
on public.briefing_modules
for select
to anon
using (
  public.can_read_briefing_via_token(briefing_id)
);

create policy modules_insert
on public.briefing_modules
for insert
to authenticated
with check (
  exists (
    select 1
    from public.briefings b
    where b.id = briefing_modules.briefing_id
      and public.has_workspace_role(b.workspace_id, array['owner','admin'])
  )
);

create policy modules_update
on public.briefing_modules
for update
to authenticated
using (
  exists (
    select 1
    from public.briefings b
    where b.id = briefing_modules.briefing_id
      and public.has_workspace_role(b.workspace_id, array['owner','admin','member'])
  )
)
with check (
  exists (
    select 1
    from public.briefings b
    where b.id = briefing_modules.briefing_id
      and public.has_workspace_role(b.workspace_id, array['owner','admin','member'])
  )
);

create policy modules_delete
on public.briefing_modules
for delete
to authenticated
using (
  exists (
    select 1
    from public.briefings b
    where b.id = briefing_modules.briefing_id
      and public.has_workspace_role(b.workspace_id, array['owner','admin'])
  )
);

create policy staff_select
on public.staff
for select
to authenticated
using (
  exists (
    select 1
    from public.briefings b
    where b.id = staff.briefing_id
      and public.is_workspace_member(b.workspace_id)
  )
);

create policy staff_insert
on public.staff
for insert
to authenticated
with check (
  exists (
    select 1
    from public.briefings b
    where b.id = staff.briefing_id
      and public.has_workspace_role(b.workspace_id, array['owner','admin'])
  )
);

create policy staff_update
on public.staff
for update
to authenticated
using (
  exists (
    select 1
    from public.briefings b
    where b.id = staff.briefing_id
      and public.has_workspace_role(b.workspace_id, array['owner','admin','member'])
  )
)
with check (
  exists (
    select 1
    from public.briefings b
    where b.id = staff.briefing_id
      and public.has_workspace_role(b.workspace_id, array['owner','admin','member'])
  )
);

create policy staff_delete
on public.staff
for delete
to authenticated
using (
  exists (
    select 1
    from public.briefings b
    where b.id = staff.briefing_id
      and public.has_workspace_role(b.workspace_id, array['owner','admin'])
  )
);

create policy briefing_exports_select
on public.briefing_exports
for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy briefing_exports_insert
on public.briefing_exports
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.has_workspace_role(workspace_id, array['owner','admin','member'])
);

create policy public_links_select_token_only
on public.public_links
for select
to anon
using (
  token = public.request_header('x-briefing-token')
  and revoked_at is null
  and (expires_at is null or expires_at > now())
);

create policy public_links_insert_own
on public.public_links
for insert
to authenticated
with check (created_by = auth.uid());

create policy public_links_select_own
on public.public_links
for select
to authenticated
using (created_by = auth.uid());

create policy public_links_update_own
on public.public_links
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy public_links_delete_own
on public.public_links
for delete
to authenticated
using (created_by = auth.uid());

create policy usage_select_own
on public.usage_counters
for select
to authenticated
using (user_id = auth.uid());
