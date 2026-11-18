-- =====================================================================
-- Step A foundation: accounts, players, clubs, membership, courts, audit.
-- Source of truth for the database. See product-research/database-design.md.
-- =====================================================================

create extension if not exists citext;

-- ---------- private helper schema (not exposed through the API) ----------
create schema if not exists app;
revoke all on schema app from public;

-- ---------- enums ----------
create type public.age_band as enum ('adult', '14_17', 'under_14');
create type public.club_role as enum ('owner', 'admin', 'organiser', 'player');
create type public.membership_status as enum ('pending', 'active', 'removed');
create type public.join_policy as enum ('open', 'approval');
create type public.tier as enum ('new', 'beginner', 'improver', 'intermediate', 'advanced', 'competitive');

-- ---------- generic triggers ----------
create or replace function app.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function app.forbid_update_delete() returns trigger
language plpgsql as $$
begin
  raise exception 'Table % is append-only: % is not allowed', tg_table_name, tg_op
    using errcode = 'insufficient_privilege';
end $$;

-- ---------- accounts (1:1 with auth.users) ----------
create table public.accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext unique,
  display_name text,
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger accounts_updated_at before update on public.accounts
  for each row execute function app.set_updated_at();

-- Create the account row automatically when someone signs up.
create or replace function app.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.accounts (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function app.handle_new_auth_user();

-- ---------- players ----------
create table public.players (
  id uuid primary key default gen_random_uuid(),
  account_id uuid unique references public.accounts (id) on delete set null,
  managed_by_account_id uuid references public.accounts (id) on delete set null,
  created_by_club_id uuid,
  first_name text not null check (length(first_name) between 1 and 60),
  last_name text not null default '' check (length(last_name) <= 60),
  display_name text not null check (length(display_name) between 1 and 60),
  age_band public.age_band not null default 'adult',
  self_tier public.tier,
  gender text,
  photo_path text,
  preferences jsonb not null default '{}'::jsonb,
  privacy jsonb not null default '{"show_rating": false, "in_rankings": true}'::jsonb,
  consent_recorded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint players_owned_xor_managed check (not (account_id is not null and managed_by_account_id is not null)),
  constraint players_juniors_managed check (age_band = 'adult' or (managed_by_account_id is not null and account_id is null)),
  constraint players_juniors_consent check (age_band = 'adult' or consent_recorded_at is not null)
);
create index players_managed_by_idx on public.players (managed_by_account_id);
create trigger players_updated_at before update on public.players
  for each row execute function app.set_updated_at();

-- ---------- consents ----------
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  player_id uuid references public.players (id) on delete cascade,
  kind text not null check (kind in ('privacy_notice', 'terms', 'junior_parental')),
  version text not null,
  agreed_at timestamptz not null default now()
);
create trigger consents_append_only before update or delete on public.consents
  for each row execute function app.forbid_update_delete();

-- ---------- clubs ----------
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 60),
  name text not null check (length(name) between 2 and 80),
  time_zone text not null default 'Asia/Dubai',
  currency char(3) not null default 'AED',
  country char(2) not null default 'AE',
  week_start smallint not null default 1 check (week_start in (1, 6, 7)),
  join_policy public.join_policy not null default 'approval',
  join_token_hash text,
  juniors_allowed boolean not null default true,
  default_fees jsonb not null default '{"member": 0, "guest": 0, "junior": 0}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid not null references public.accounts (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create trigger clubs_updated_at before update on public.clubs
  for each row execute function app.set_updated_at();

alter table public.players
  add constraint players_created_by_club_fk foreign key (created_by_club_id) references public.clubs (id) on delete set null;

-- ---------- club members ----------
create table public.club_members (
  club_id uuid not null references public.clubs (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  role public.club_role not null default 'player',
  status public.membership_status not null default 'active',
  joined_at timestamptz not null default now(),
  removed_at timestamptz,
  primary key (club_id, player_id)
);
create index club_members_player_idx on public.club_members (player_id);

-- Owner/admin/organiser must be a player with their own account.
create or replace function app.check_elevated_role() returns trigger
language plpgsql as $$
begin
  if new.role <> 'player' and not exists (
    select 1 from public.players p where p.id = new.player_id and p.account_id is not null
  ) then
    raise exception 'Only players with their own account can be %', new.role
      using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger club_members_elevated_role before insert or update on public.club_members
  for each row execute function app.check_elevated_role();

-- A club always keeps at least one active owner.
create or replace function app.keep_one_owner() returns trigger
language plpgsql as $$
declare remaining int;
begin
  if (tg_op = 'DELETE' and old.role = 'owner' and old.status = 'active')
     or (tg_op = 'UPDATE' and old.role = 'owner' and old.status = 'active'
         and (new.role <> 'owner' or new.status <> 'active')) then
    select count(*) into remaining from public.club_members
      where club_id = old.club_id and role = 'owner' and status = 'active' and player_id <> old.player_id;
    if remaining = 0 then
      raise exception 'A club must keep at least one owner' using errcode = 'check_violation';
    end if;
  end if;
  return coalesce(new, old);
end $$;
create trigger club_members_keep_owner before update or delete on public.club_members
  for each row execute function app.keep_one_owner();

-- ---------- courts ----------
create table public.courts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  name text not null check (length(name) between 1 and 20),
  sort_order int not null default 0,
  archived_at timestamptz,
  unique (id, club_id)
);
create unique index courts_name_per_club on public.courts (club_id, lower(name)) where archived_at is null;

-- ---------- audit log (append-only) ----------
create table public.audit_log (
  id bigint generated always as identity primary key,
  club_id uuid references public.clubs (id) on delete set null,
  actor_account_id uuid references public.accounts (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  reason text,
  created_at timestamptz not null default now()
);
create index audit_log_club_idx on public.audit_log (club_id, created_at);
create trigger audit_log_append_only before update or delete on public.audit_log
  for each row execute function app.forbid_update_delete();

-- ---------- authorisation helpers (used by RLS and Realtime) ----------
create or replace function app.is_club_member(p_club uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.club_members m
    join public.players p on p.id = m.player_id
    where m.club_id = p_club and m.status = 'active'
      and (p.account_id = auth.uid() or p.managed_by_account_id = auth.uid())
  )
$$;

create or replace function app.has_club_role(p_club uuid, p_roles public.club_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.club_members m
    join public.players p on p.id = m.player_id
    where m.club_id = p_club and m.status = 'active'
      and p.account_id = auth.uid() and m.role = any (p_roles)
  )
$$;

-- ---------- Row Level Security: deny by default ----------
-- Browsers and apps never read or write these tables directly; all access goes
-- through server code. RLS is the second line of defence.
alter table public.accounts enable row level security;
alter table public.players enable row level security;
alter table public.consents enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.courts enable row level security;
alter table public.audit_log enable row level security;

revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

-- Helper functions may be called by RLS policies evaluated as the signed-in user,
-- and the sign-up trigger runs as Supabase's auth service role.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant usage on schema app to authenticated;
    grant execute on function app.is_club_member(uuid) to authenticated;
    grant execute on function app.has_club_role(uuid, public.club_role[]) to authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'supabase_auth_admin') then
    grant usage on schema app to supabase_auth_admin;
    grant execute on function app.handle_new_auth_user() to supabase_auth_admin;
  end if;
end $$;
