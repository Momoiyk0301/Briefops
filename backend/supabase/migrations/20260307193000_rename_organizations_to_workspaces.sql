do $$
begin
  if to_regclass('public.organizations') is not null and to_regclass('public.workspaces') is null then
    alter table public.organizations rename to workspaces;
  end if;
end $$;
