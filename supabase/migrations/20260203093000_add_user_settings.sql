alter table public.users
  add column if not exists name text;

alter table public.users
  add column if not exists locale text not null default 'en';

alter table public.users
  add column if not exists currency text not null default 'BRL';

update public.users
set locale = 'en'
where locale is null;

update public.users
set currency = 'BRL'
where currency is null;
