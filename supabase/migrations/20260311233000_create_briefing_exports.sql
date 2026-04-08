create table if not exists public.briefing_exports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  briefing_id uuid not null references public.briefings(id) on delete cascade,
  version integer not null check (version > 0),
  file_path text not null,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid not null references public.profiles(id) on delete restrict,
  unique (briefing_id, version),
  unique (file_path)
);

create index if not exists idx_briefing_exports_workspace_id on public.briefing_exports(workspace_id);
create index if not exists idx_briefing_exports_briefing_id on public.briefing_exports(briefing_id);
create index if not exists idx_briefing_exports_created_at on public.briefing_exports(created_at desc);

grant select, insert on public.briefing_exports to authenticated;

alter table public.briefing_exports enable row level security;
alter table public.briefing_exports force row level security;

drop policy if exists briefing_exports_select on public.briefing_exports;
drop policy if exists briefing_exports_insert on public.briefing_exports;

create policy briefing_exports_select
on public.briefing_exports
for select
to authenticated
using (public.is_org_member(workspace_id));

create policy briefing_exports_insert
on public.briefing_exports
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.has_org_role(workspace_id, array['owner','admin','member'])
);
