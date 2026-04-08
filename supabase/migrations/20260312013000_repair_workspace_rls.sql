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

-- Temporary compatibility wrappers for any remaining legacy references.
create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_workspace_member(p_org_id);
$$;

create or replace function public.has_org_role(p_org_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_workspace_role(p_org_id, p_roles);
$$;

create or replace function public.shares_org_with_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.shares_workspace_with_user(p_user_id);
$$;

drop policy if exists profiles_select on public.profiles;
drop policy if exists memberships_select on public.memberships;
drop policy if exists memberships_insert on public.memberships;
drop policy if exists memberships_update on public.memberships;
drop policy if exists memberships_delete on public.memberships;
drop policy if exists briefings_select on public.briefings;
drop policy if exists briefings_insert on public.briefings;
drop policy if exists briefings_update on public.briefings;
drop policy if exists briefings_delete on public.briefings;
drop policy if exists modules_registry_insert on public.modules;
drop policy if exists modules_registry_update on public.modules;
drop policy if exists modules_registry_delete on public.modules;
drop policy if exists modules_select on public.briefing_modules;
drop policy if exists modules_insert on public.briefing_modules;
drop policy if exists modules_update on public.briefing_modules;
drop policy if exists modules_delete on public.briefing_modules;
drop policy if exists staff_select on public.staff;
drop policy if exists staff_insert on public.staff;
drop policy if exists staff_update on public.staff;
drop policy if exists staff_delete on public.staff;
drop policy if exists briefing_exports_select on public.briefing_exports;
drop policy if exists briefing_exports_insert on public.briefing_exports;
drop policy if exists orgs_select on public.workspaces;
drop policy if exists orgs_insert on public.workspaces;
drop policy if exists orgs_update on public.workspaces;
drop policy if exists orgs_delete on public.workspaces;

create policy profiles_select
on public.profiles
for select
to authenticated
using (
  id = auth.uid() or public.shares_workspace_with_user(id)
);

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
using (public.is_workspace_member(workspace_id));

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
