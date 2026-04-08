do $$
begin
  if to_regclass('public.public_links') is null then
    return;
  end if;

  alter table public.public_links
    add column if not exists resource_type text;

  update public.public_links
  set resource_type = 'pdf'
  where resource_type is null or btrim(resource_type) = '';

  alter table public.public_links
    alter column resource_type set default 'pdf';

  alter table public.public_links
    alter column resource_type set not null;

  create index if not exists idx_public_links_resource_type on public.public_links(resource_type);
  create index if not exists idx_public_links_briefing_resource on public.public_links(briefing_id, resource_type);
end $$;

do $$
begin
  if to_regclass('public.public_links') is not null then
    revoke select on public.public_links from anon;
    drop policy if exists public_links_select_token_only on public.public_links;
  end if;
end $$;

do $$
begin
  if to_regclass('public.briefings') is not null then
    revoke select on public.briefings from anon;
    drop policy if exists briefings_select on public.briefings;
    create policy briefings_select
    on public.briefings
    for select
    to authenticated
    using (public.is_org_member(org_id));
  end if;

  if to_regclass('public.briefing_modules') is not null and to_regclass('public.briefings') is not null then
    revoke select on public.briefing_modules from anon;
    drop policy if exists modules_select on public.briefing_modules;
    create policy modules_select
    on public.briefing_modules
    for select
    to authenticated
    using (
      exists (
        select 1
        from public.briefings b
        where b.id = briefing_modules.briefing_id
          and public.is_org_member(b.org_id)
      )
    );
  end if;
end $$;
