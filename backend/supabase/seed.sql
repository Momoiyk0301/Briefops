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

  insert into public.workspaces (name, owner_id)
  values ('Demo Org', v_user_id)
  on conflict (owner_id) do update
    set name = excluded.name
  returning id into v_org_id;

  if v_org_id is null then
    select id into v_org_id from public.workspaces where owner_id = v_user_id;
  end if;

  insert into public.memberships (workspace_id, user_id, role)
  values (v_org_id, v_user_id, 'owner')
  on conflict (workspace_id, user_id) do update
  set role = excluded.role;

  insert into public.briefings (org_id, title, event_date, location_text, created_by)
  values (v_org_id, 'Demo Briefing', current_date + 7, 'Brussels Expo', v_user_id)
  returning id into v_briefing_id;

  insert into public.briefing_modules (briefing_id, module_key, enabled, data_json)
  values
    (
      v_briefing_id,
      'metadata',
      true,
      '{"main_contact_name":"Production lead","main_contact_phone":"+32 470 00 00 00","global_notes":"Briefing de démonstration"}'::jsonb
    ),
    (
      v_briefing_id,
      'access',
      true,
      '{"address":"Brussels Expo, Hall A","parking":"Parking P1","entrance":"Entrée principale","on_site_contact":"Site manager"}'::jsonb
    ),
    (
      v_briefing_id,
      'notes',
      true,
      '{"text":"Arrivée staff 08:00. Check matériel avant ouverture."}'::jsonb
    )
  on conflict (briefing_id, module_key) do nothing;

  insert into public.staff (briefing_id, full_name, role, phone, email, notes)
  select v_briefing_id, 'Alice Martin', 'Lead', '+32 470 11 22 33', 'alice@example.com', 'Coordination générale'
  where not exists (
    select 1 from public.staff s where s.briefing_id = v_briefing_id and s.email = 'alice@example.com'
  );

  insert into public.staff (briefing_id, full_name, role, phone, email, notes)
  select v_briefing_id, 'Yassine B.', 'Runner', '+32 470 44 55 66', 'yassine@example.com', 'Support logistique'
  where not exists (
    select 1 from public.staff s where s.briefing_id = v_briefing_id and s.email = 'yassine@example.com'
  );
end $$;
