-- Minimal seed: attach first existing auth user to one org + sample briefing
-- Run after schema.sql

do $$
declare
  v_user_id uuid;
  v_email text;
  v_org_id uuid;
  v_briefing_id uuid;
begin
  select id, email
  into v_user_id, v_email
  from auth.users
  order by created_at
  limit 1;

  if v_user_id is null then
    raise notice 'No auth.users found. Create a user first in Supabase Auth.';
    return;
  end if;

  insert into public.profiles (id, email, full_name, plan)
  values (v_user_id, coalesce(v_email, 'user@example.com'), 'First User', 'free')
  on conflict (id) do update
    set email = excluded.email;

  insert into public.organizations (name, owner_id)
  values ('Demo Org', v_user_id)
  on conflict (owner_id) do update
    set name = excluded.name
  returning id into v_org_id;

  if v_org_id is null then
    select id into v_org_id from public.organizations where owner_id = v_user_id;
  end if;

  insert into public.memberships (org_id, user_id, role)
  values (v_org_id, v_user_id, 'owner')
  on conflict (org_id, user_id) do update
    set role = excluded.role;

  insert into public.briefings (org_id, title, event_date, location_text, created_by)
  values (v_org_id, 'Demo Briefing', current_date + 7, 'Brussels Expo', v_user_id)
  returning id into v_briefing_id;

  insert into public.briefing_modules (briefing_id, module_key, enabled, data_json)
  values
    (v_briefing_id, 'agenda', true, '{"sessions":[{"time":"09:00","title":"Opening"}]}'::jsonb),
    (v_briefing_id, 'logistics', true, '{"venue":"Hall A","access":"Main gate"}'::jsonb)
  on conflict (briefing_id, module_key) do nothing;
end $$;
