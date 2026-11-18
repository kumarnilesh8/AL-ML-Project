-- =====================================================================
-- Step C2: sessions, registration with a waiting list, in-app notifications.
-- =====================================================================

create type public.session_status as enum ('draft', 'open', 'live', 'ended', 'cancelled');
create type public.session_visibility as enum ('club', 'invited');
create type public.registration_status as enum ('registered', 'waitlisted', 'cancelled');

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  title text not null check (length(title) between 2 and 80),
  venue text not null default '' check (length(venue) <= 120),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity int not null check (capacity between 4 and 200),
  format text not null default 'doubles' check (format in ('doubles')),
  -- one game per match: points to win, cap, win by two
  scoring jsonb not null default '{"pointsToWin": 21, "cap": 30, "winByTwo": true}'::jsonb,
  preset text not null default 'balanced' check (preset in ('social', 'balanced', 'competitive')),
  visibility public.session_visibility not null default 'club',
  registration_opens_at timestamptz not null default now(),
  registration_closes_at timestamptz not null,
  -- fees in minor units (fils) of the club currency
  fees jsonb not null default '{"member": 0, "guest": 0, "junior": 0}'::jsonb,
  standings_method text not null default 'win_pct' check (standings_method in ('win_pct', 'most_wins')),
  min_games_to_rank smallint not null default 3 check (min_games_to_rank between 1 and 20),
  status public.session_status not null default 'open',
  cancelled_reason text,
  created_by uuid not null references public.accounts (id),
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, club_id),
  constraint sessions_end_after_start check (ends_at > starts_at),
  constraint sessions_reasonable_length check (ends_at - starts_at <= interval '12 hours'),
  constraint sessions_registration_window check (registration_opens_at < registration_closes_at and registration_closes_at <= ends_at)
);
create index sessions_club_starts_idx on public.sessions (club_id, starts_at);
create trigger sessions_updated_at before update on public.sessions
  for each row execute function app.set_updated_at();

create table public.session_courts (
  session_id uuid not null,
  club_id uuid not null,
  court_id uuid not null,
  active boolean not null default true,
  primary key (session_id, court_id),
  foreign key (session_id, club_id) references public.sessions (id, club_id) on delete cascade,
  foreign key (court_id, club_id) references public.courts (id, club_id)
);

create table public.session_invites (
  session_id uuid not null,
  club_id uuid not null,
  player_id uuid not null references public.players (id) on delete cascade,
  primary key (session_id, player_id),
  foreign key (session_id, club_id) references public.sessions (id, club_id) on delete cascade
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  club_id uuid not null,
  player_id uuid not null references public.players (id) on delete cascade,
  status public.registration_status not null,
  waitlist_position int check (waitlist_position > 0),
  registered_at timestamptz not null default now(),
  cancelled_at timestamptz,
  late_cancellation boolean not null default false,
  acted_by uuid references public.accounts (id),
  foreign key (session_id, club_id) references public.sessions (id, club_id) on delete cascade,
  constraint registrations_waitlist_consistent check ((status = 'waitlisted') = (waitlist_position is not null))
);
create unique index registrations_one_active on public.registrations (session_id, player_id) where status <> 'cancelled';
create unique index registrations_waitlist_pos on public.registrations (session_id, waitlist_position) where status = 'waitlisted';
create index registrations_session_idx on public.registrations (session_id, status, registered_at);
create index registrations_player_idx on public.registrations (player_id, status);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts (id) on delete cascade,
  player_id uuid references public.players (id) on delete set null,
  club_id uuid references public.clubs (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_account_idx on public.notifications (account_id, read_at, created_at desc);

alter table public.sessions enable row level security;
alter table public.session_courts enable row level security;
alter table public.session_invites enable row level security;
alter table public.registrations enable row level security;
alter table public.notifications enable row level security;
revoke all on public.sessions, public.session_courts, public.session_invites, public.registrations, public.notifications from anon, authenticated;
