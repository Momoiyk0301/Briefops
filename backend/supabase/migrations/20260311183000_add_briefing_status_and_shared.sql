alter table public.briefings
  add column if not exists status text not null default 'draft',
  add column if not exists shared boolean not null default false;

alter table public.briefings
  drop constraint if exists briefings_status_check;

alter table public.briefings
  add constraint briefings_status_check
  check (status in ('draft', 'ready', 'archived'));

update public.briefings b
set shared = exists (
  select 1
  from public.public_links pl
  where pl.briefing_id = b.id
    and pl.revoked_at is null
);
