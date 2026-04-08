do $$
begin
  if to_regclass('public.memberships') is null then
    return;
  end if;

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
    from pg_constraint
    where conname = 'memberships_org_id_user_id_key'
  ) then
    alter table public.memberships
      rename constraint memberships_org_id_user_id_key to memberships_workspace_id_user_id_key;
  end if;

  alter table public.memberships
    drop constraint if exists memberships_org_id_fkey;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'memberships_workspace_id_fkey'
  ) then
    alter table public.memberships
      add constraint memberships_workspace_id_fkey
      foreign key (workspace_id) references public.workspaces(id) on delete cascade;
  end if;

  alter index if exists public.idx_memberships_org_id rename to idx_memberships_workspace_id;
  alter index if exists public.idx_memberships_org_role rename to idx_memberships_workspace_role;

  create index if not exists idx_memberships_workspace_id on public.memberships(workspace_id);
  create index if not exists idx_memberships_workspace_role on public.memberships(workspace_id, role);

  create or replace function public.is_org_member(p_org_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
  as $fn$
    select exists (
      select 1
      from public.memberships m
      where m.workspace_id = p_org_id
        and m.user_id = auth.uid()
    );
  $fn$;

  create or replace function public.has_org_role(p_org_id uuid, p_roles text[])
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
  as $fn$
    select exists (
      select 1
      from public.memberships m
      where m.workspace_id = p_org_id
        and m.user_id = auth.uid()
        and m.role = any (p_roles)
    );
  $fn$;

  create or replace function public.shares_org_with_user(p_user_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
  as $fn$
    select exists (
      select 1
      from public.memberships me
      join public.memberships other
        on other.workspace_id = me.workspace_id
      where me.user_id = auth.uid()
        and other.user_id = p_user_id
    );
  $fn$;
end $$;
