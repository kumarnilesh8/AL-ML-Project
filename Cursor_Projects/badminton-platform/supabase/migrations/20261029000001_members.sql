-- =====================================================================
-- Step C1: joining clubs (link, email invitation), guests, juniors, roles.
-- =====================================================================

-- New clubs: anyone with the join link joins straight away (decision 28 Oct 2026).
alter table public.clubs alter column join_policy set default 'open';

-- Shareable join code (part of the club's join link). Resetting it invalidates old links.
alter table public.clubs add column join_code text;
update public.clubs set join_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 10) where join_code is null;
alter table public.clubs alter column join_code set not null;
alter table public.clubs add constraint clubs_join_code_format check (join_code ~ '^[a-z0-9]{8,16}$');
create unique index clubs_join_code_key on public.clubs (join_code);
alter table public.clubs drop column join_token_hash;

-- ---------- personal email invitations ----------
create table public.club_invites (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  email citext not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_by uuid not null references public.accounts (id),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  accepted_by uuid references public.accounts (id),
  revoked_at timestamptz,
  constraint club_invites_email_format check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);
create index club_invites_club_email_idx on public.club_invites (club_id, email);
alter table public.club_invites enable row level security;

-- ---------- guests ----------
-- A guest is a player created by an organiser for one club, with no account and no parent.
alter table public.players add constraint players_guest_is_adult
  check (created_by_club_id is null or (age_band = 'adult' and account_id is null and managed_by_account_id is null));

-- ---------- membership timestamps ----------
alter table public.club_members add column requested_at timestamptz;
alter table public.club_members add column decided_by uuid references public.accounts (id);

-- ---------- juniors may only join clubs that allow juniors ----------
create or replace function app.check_junior_allowed() returns trigger
language plpgsql as $$
begin
  if exists (select 1 from public.players p where p.id = new.player_id and p.age_band <> 'adult')
     and not exists (select 1 from public.clubs c where c.id = new.club_id and c.juniors_allowed) then
    raise exception 'This club does not accept junior players' using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger club_members_junior_allowed before insert on public.club_members
  for each row execute function app.check_junior_allowed();

revoke all on public.club_invites from anon, authenticated;
