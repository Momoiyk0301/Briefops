delete from public.public_links
where link_type = 'pdf';

alter table public.public_links
  drop constraint if exists public_links_link_type_check;

alter table public.public_links
  add constraint public_links_link_type_check
  check (link_type in ('staff', 'audience'));
