alter table public.briefing_exports
  add column if not exists status text not null default 'ready',
  add column if not exists error_message text;

alter table public.briefing_exports
  drop constraint if exists briefing_exports_status_check;

alter table public.briefing_exports
  add constraint briefing_exports_status_check
  check (status in ('creating', 'generating', 'ready', 'failed'));
