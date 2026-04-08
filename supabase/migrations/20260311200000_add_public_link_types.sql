alter table public.public_links
  add column if not exists link_type text not null default 'staff',
  add column if not exists audience_tag text;

alter table public.public_links
  drop constraint if exists public_links_link_type_check;

alter table public.public_links
  add constraint public_links_link_type_check
  check (link_type in ('staff', 'audience'));
