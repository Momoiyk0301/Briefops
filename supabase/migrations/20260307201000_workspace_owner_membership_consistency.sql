do $$
begin
  if to_regclass('public.workspaces') is null or to_regclass('public.memberships') is null then
    return;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'memberships'
      and column_name = 'workspace_id'
  ) then
    -- Ensure every workspace owner has an owner membership on their own workspace.
    insert into public.memberships (workspace_id, user_id, role)
    select w.id, w.owner_id, 'owner'
    from public.workspaces w
    left join public.memberships m
      on m.workspace_id = w.id
     and m.user_id = w.owner_id
    where m.id is null
    on conflict (user_id) do update
      set workspace_id = excluded.workspace_id,
          role = 'owner';

    -- Normalize legacy owner memberships created as "member".
    update public.memberships m
    set role = 'owner'
    from public.workspaces w
    where m.workspace_id = w.id
      and m.user_id = w.owner_id
      and m.role <> 'owner';
  else
    insert into public.memberships (org_id, user_id, role)
    select w.id, w.owner_id, 'owner'
    from public.workspaces w
    left join public.memberships m
      on m.org_id = w.id
     and m.user_id = w.owner_id
    where m.id is null
    on conflict (user_id) do update
      set org_id = excluded.org_id,
          role = 'owner';

    update public.memberships m
    set role = 'owner'
    from public.workspaces w
    where m.org_id = w.id
      and m.user_id = w.owner_id
      and m.role <> 'owner';
  end if;
end $$;
