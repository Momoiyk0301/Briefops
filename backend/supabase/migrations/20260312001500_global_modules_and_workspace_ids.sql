do $$
declare
  canonical record;
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'memberships'
      and column_name = 'org_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'memberships'
      and column_name = 'workspace_id'
  ) then
    alter table public.memberships rename column org_id to workspace_id;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'briefings'
      and column_name = 'org_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'briefings'
      and column_name = 'workspace_id'
  ) then
    alter table public.briefings rename column org_id to workspace_id;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'staff'
      and column_name = 'org_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'staff'
      and column_name = 'workspace_id'
  ) then
    alter table public.staff rename column org_id to workspace_id;
  end if;
end $$;

create table if not exists public.workspace_modules (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, module_id)
);

create index if not exists idx_workspace_modules_workspace_id on public.workspace_modules(workspace_id);
create index if not exists idx_workspace_modules_module_id on public.workspace_modules(module_id);

drop trigger if exists trg_workspace_modules_updated_at on public.workspace_modules;
create trigger trg_workspace_modules_updated_at
before update on public.workspace_modules
for each row
execute function public.set_updated_at();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'modules'
      and column_name = 'org_id'
  ) then
    insert into public.workspace_modules (workspace_id, module_id, enabled)
    select distinct old.org_id, canonical.id, old.enabled
    from public.modules old
    join public.workspaces workspace
      on workspace.id = old.org_id
    join lateral (
      select m.id
      from public.modules m
      where m.type = old.type
      order by m.enabled desc, m.updated_at desc, m.created_at asc, m.id asc
      limit 1
    ) canonical on true
    on conflict (workspace_id, module_id) do update
      set enabled = excluded.enabled;

    update public.briefing_modules bm
    set module_id = canonical.id
    from public.modules old
    join lateral (
      select m.id
      from public.modules m
      where m.type = old.type
      order by m.enabled desc, m.updated_at desc, m.created_at asc, m.id asc
      limit 1
    ) canonical on true
    where bm.module_id = old.id
      and bm.module_id is distinct from canonical.id;

    delete from public.modules old
    using public.modules survivor
    where old.type = survivor.type
      and old.id <> survivor.id
      and survivor.id = (
        select m.id
        from public.modules m
        where m.type = old.type
        order by m.enabled desc, m.updated_at desc, m.created_at asc, m.id asc
        limit 1
      );

    drop policy if exists modules_registry_select on public.modules;
    drop policy if exists modules_registry_insert on public.modules;
    drop policy if exists modules_registry_update on public.modules;
    drop policy if exists modules_registry_delete on public.modules;

    alter table public.modules drop constraint if exists modules_org_id_type_key;
    alter table public.modules drop constraint if exists modules_type_key;
    drop index if exists public.idx_modules_registry_org_id;
    alter table public.modules drop column if exists org_id;
  end if;
end $$;

alter table public.modules
  drop constraint if exists modules_type_key;
alter table public.modules
  add constraint modules_type_key unique (type);

alter table public.memberships
  drop constraint if exists memberships_org_id_user_id_key;
alter table public.memberships
  add constraint memberships_workspace_id_user_id_key unique (workspace_id, user_id);

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

create or replace function public.sync_staff_workspace_id()
returns trigger
language plpgsql
as $$
begin
  select b.workspace_id into new.workspace_id
  from public.briefings b
  where b.id = new.briefing_id;

  if new.workspace_id is null then
    raise exception 'Briefing % not found for staff row', new.briefing_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_staff_sync_org_id on public.staff;
drop trigger if exists trg_staff_sync_workspace_id on public.staff;
create trigger trg_staff_sync_workspace_id
before insert or update of briefing_id on public.staff
for each row
execute function public.sync_staff_workspace_id();

grant select on public.modules to authenticated;
grant select, insert, update, delete on public.workspace_modules to authenticated;

alter table public.workspace_modules enable row level security;
alter table public.workspace_modules force row level security;

drop policy if exists workspace_modules_select on public.workspace_modules;
drop policy if exists workspace_modules_insert on public.workspace_modules;
drop policy if exists workspace_modules_update on public.workspace_modules;
drop policy if exists workspace_modules_delete on public.workspace_modules;

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

drop policy if exists modules_registry_select on public.modules;
drop policy if exists modules_registry_insert on public.modules;
drop policy if exists modules_registry_update on public.modules;
drop policy if exists modules_registry_delete on public.modules;

create policy modules_registry_select
on public.modules
for select
to authenticated
using (true);

insert into public.modules (name, type, version, icon, category, enabled, default_layout, default_data)
values
  ('Metadonnees', 'metadata', 1, 'file-text', 'general', true, '{"desktop":{"x":0,"y":0,"w":12,"h":3},"mobile":{"x":0,"y":0,"w":12,"h":4},"constraints":{"minW":3,"minH":2,"maxW":12,"maxH":8},"behavior":{"draggable":true,"resizable":true},"style":{"variant":"default","shape":"card","density":"comfortable"}}'::jsonb, '{"main_contact_name":"","main_contact_phone":"","global_notes":"","team_mode":false,"teams":[]}'::jsonb),
  ('Acces', 'access', 1, 'map-pin', 'operations', true, '{"desktop":{"x":0,"y":0,"w":12,"h":3},"mobile":{"x":0,"y":0,"w":12,"h":4},"constraints":{"minW":3,"minH":2,"maxW":12,"maxH":8},"behavior":{"draggable":true,"resizable":true},"style":{"variant":"default","shape":"card","density":"comfortable"}}'::jsonb, '{"address":"","parking":"","entrance":"","on_site_contact":""}'::jsonb),
  ('Livraisons', 'delivery', 1, 'truck', 'logistics', false, '{"desktop":{"x":0,"y":0,"w":12,"h":3},"mobile":{"x":0,"y":0,"w":12,"h":4},"constraints":{"minW":3,"minH":2,"maxW":12,"maxH":8},"behavior":{"draggable":true,"resizable":true},"style":{"variant":"default","shape":"card","density":"comfortable"}}'::jsonb, '{"deliveries":[]}'::jsonb),
  ('Vehicules', 'vehicle', 1, 'car', 'logistics', false, '{"desktop":{"x":0,"y":0,"w":12,"h":3},"mobile":{"x":0,"y":0,"w":12,"h":4},"constraints":{"minW":3,"minH":2,"maxW":12,"maxH":8},"behavior":{"draggable":true,"resizable":true},"style":{"variant":"default","shape":"card","density":"comfortable"}}'::jsonb, '{"vehicles":[]}'::jsonb),
  ('Equipement', 'equipment', 1, 'wrench', 'operations', false, '{"desktop":{"x":0,"y":0,"w":12,"h":3},"mobile":{"x":0,"y":0,"w":12,"h":4},"constraints":{"minW":3,"minH":2,"maxW":12,"maxH":8},"behavior":{"draggable":true,"resizable":true},"style":{"variant":"default","shape":"card","density":"comfortable"}}'::jsonb, '{"items_text":""}'::jsonb),
  ('Staff', 'staff', 1, 'users', 'team', false, '{"desktop":{"x":0,"y":0,"w":12,"h":3},"mobile":{"x":0,"y":0,"w":12,"h":4},"constraints":{"minW":3,"minH":2,"maxW":12,"maxH":8},"behavior":{"draggable":true,"resizable":true},"style":{"variant":"default","shape":"card","density":"comfortable"}}'::jsonb, '{"roles":[]}'::jsonb),
  ('Notes', 'notes', 1, 'sticky-note', 'general', true, '{"desktop":{"x":0,"y":0,"w":12,"h":3},"mobile":{"x":0,"y":0,"w":12,"h":4},"constraints":{"minW":3,"minH":2,"maxW":12,"maxH":8},"behavior":{"draggable":true,"resizable":true},"style":{"variant":"default","shape":"card","density":"comfortable"}}'::jsonb, '{"text":""}'::jsonb),
  ('Contacts', 'contact', 1, 'phone', 'team', false, '{"desktop":{"x":0,"y":0,"w":12,"h":3},"mobile":{"x":0,"y":0,"w":12,"h":4},"constraints":{"minW":3,"minH":2,"maxW":12,"maxH":8},"behavior":{"draggable":true,"resizable":true},"style":{"variant":"default","shape":"card","density":"comfortable"}}'::jsonb, '{"people":[]}'::jsonb)
on conflict (type) do nothing;
