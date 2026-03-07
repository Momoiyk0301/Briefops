do $$
begin
  if to_regclass('public.workspaces') is not null then
    alter table public.workspaces
      add column if not exists country text;
    alter table public.workspaces
      add column if not exists team_size integer;
    alter table public.workspaces
      add column if not exists vat_number text;
  end if;

  if to_regclass('public.profiles') is not null then
    alter table public.profiles
      add column if not exists onboarding_step text;
  end if;
end $$;

update public.workspaces
set country = 'Belgium'
where country is null or btrim(country) = '';

update public.profiles p
set onboarding_step = case
  when exists (
    select 1
    from public.memberships m
    where m.user_id = p.id
  ) then 'done'
  else 'workspace'
end
where onboarding_step is null or btrim(onboarding_step) = '';

do $$
begin
  if to_regclass('public.workspaces') is not null then
    alter table public.workspaces
      alter column country set default 'Belgium';
    alter table public.workspaces
      alter column country set not null;

    if not exists (
      select 1
      from pg_constraint
      where conname = 'workspaces_team_size_check'
    ) then
      alter table public.workspaces
        add constraint workspaces_team_size_check check (team_size is null or team_size > 0);
    end if;
  end if;

  if to_regclass('public.profiles') is not null then
    alter table public.profiles
      alter column onboarding_step set default 'workspace';

    if not exists (
      select 1
      from pg_constraint
      where conname = 'profiles_onboarding_step_check'
    ) then
      alter table public.profiles
        add constraint profiles_onboarding_step_check check (onboarding_step in ('workspace', 'products', 'demo', 'done'));
    end if;
  end if;
end $$;
