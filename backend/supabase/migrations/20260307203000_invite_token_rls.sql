do $$
begin
  if to_regclass('public.briefings') is not null then
    grant select on public.briefings to anon;

    drop policy if exists briefings_select_invite on public.briefings;
    create policy briefings_select_invite
    on public.briefings
    for select
    to anon
    using (public.can_read_briefing_via_token(id));
  end if;

  if to_regclass('public.briefing_modules') is not null then
    grant select on public.briefing_modules to anon;

    drop policy if exists modules_select_invite on public.briefing_modules;
    create policy modules_select_invite
    on public.briefing_modules
    for select
    to anon
    using (public.can_read_briefing_via_token(briefing_id));
  end if;

  if to_regclass('public.public_links') is not null then
    grant select on public.public_links to anon;

    drop policy if exists public_links_select_token_only on public.public_links;
    create policy public_links_select_token_only
    on public.public_links
    for select
    to anon
    using (
      token = public.request_header('x-briefing-token')
      and revoked_at is null
      and (expires_at is null or expires_at > now())
    );
  end if;
end $$;
