alter table public.workspaces
  add column if not exists plan text not null default 'starter',
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id text,
  add column if not exists subscription_name text,
  add column if not exists subscription_status text,
  add column if not exists current_period_end timestamptz;

alter table public.workspaces
  drop constraint if exists workspaces_plan_check;

alter table public.workspaces
  add constraint workspaces_plan_check
  check (plan in ('starter', 'pro', 'guest', 'funder', 'enterprise'));

create unique index if not exists workspaces_stripe_customer_id_key
  on public.workspaces (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists workspaces_stripe_subscription_id_key
  on public.workspaces (stripe_subscription_id)
  where stripe_subscription_id is not null;

update public.workspaces w
set
  plan = case lower(coalesce(p.plan, 'starter'))
    when 'free' then 'starter'
    when 'plus' then 'pro'
    when 'start' then 'starter'
    when 'guest' then 'guest'
    when 'funder' then 'funder'
    when 'enterprise' then 'enterprise'
    when 'pro' then 'pro'
    else 'starter'
  end,
  stripe_customer_id = coalesce(w.stripe_customer_id, p.stripe_customer_id),
  stripe_subscription_id = coalesce(w.stripe_subscription_id, p.stripe_subscription_id),
  stripe_price_id = coalesce(w.stripe_price_id, p.stripe_price_id),
  subscription_name = coalesce(w.subscription_name, p.subscription_name),
  subscription_status = coalesce(w.subscription_status, p.subscription_status),
  current_period_end = coalesce(w.current_period_end, p.current_period_end)
from public.profiles p
where w.owner_id = p.id;

alter table public.memberships
  drop column if exists plan_name,
  drop column if exists stripe_price_id,
  drop column if exists stripe_product_id;
