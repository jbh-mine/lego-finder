-- LOCAL TEST DATABASE ONLY. Never run this bootstrap against the hosted project.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create table public.kuji_probe(id integer primary key, note text);
insert into public.kuji_probe values(1,'unrelated application must remain unchanged');
alter table public.kuji_probe enable row level security;
grant select on public.kuji_probe to authenticated;
