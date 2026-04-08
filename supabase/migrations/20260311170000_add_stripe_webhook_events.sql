create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_stripe_webhook_events_processed_at
  on public.stripe_webhook_events(processed_at desc);
