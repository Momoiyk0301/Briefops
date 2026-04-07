alter table public.profiles
  drop constraint if exists profiles_plan_check;

alter table public.profiles
  add column if not exists avatar_path text;

alter table public.profiles
  alter column plan set default 'starter';

update public.profiles
set plan = case lower(coalesce(trim(plan), ''))
  when 'free' then 'starter'
  when 'plus' then 'pro'
  when 'start' then 'starter'
  when 'starter' then 'starter'
  when 'pro' then 'pro'
  when 'guest' then 'guest'
  when 'funder' then 'funder'
  when 'enterprise' then 'enterprise'
  else 'starter'
end
where plan is null
   or lower(coalesce(trim(plan), '')) not in ('starter', 'pro', 'guest', 'funder', 'enterprise')
   or lower(coalesce(trim(plan), '')) in ('free', 'plus', 'start');

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('starter', 'pro', 'guest', 'funder', 'enterprise'));

alter table public.workspaces
  add column if not exists storage_used_bytes bigint not null default 0,
  add column if not exists briefings_count integer not null default 0,
  add column if not exists pdf_exports_month integer not null default 0,
  add column if not exists pdf_exports_reset_at date not null default now(),
  add column if not exists logo_path text,
  add column if not exists initials text,
  add column if not exists due_at timestamptz;

update public.workspaces
set initials = upper(
  left(coalesce(split_part(trim(name), ' ', 1), ''), 1) ||
  left(
    coalesce(
      nullif(split_part(trim(name), ' ', 2), ''),
      case
        when length(trim(name)) > 1 then substring(trim(name) from 2 for 1)
        else ''
      end
    ),
    1
  )
)
where coalesce(initials, '') = '';

update public.workspaces w
set briefings_count = counts.total
from (
  select workspace_id, count(*)::integer as total
  from public.briefings
  group by workspace_id
) counts
where counts.workspace_id = w.id;

insert into storage.buckets (id, name, public)
values ('logos', 'logos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;
