/**
 * Typed view of the tables created by supabase/migrations (the SQL migrations are the source of truth).
 * Keep this file in step with the migrations.
 */
import { sql } from 'drizzle-orm';
import { bigint, boolean, char, integer, jsonb, pgEnum, pgTable, primaryKey, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const ageBand = pgEnum('age_band', ['adult', '14_17', 'under_14']);
export const clubRole = pgEnum('club_role', ['owner', 'admin', 'organiser', 'player']);
export const membershipStatus = pgEnum('membership_status', ['pending', 'active', 'removed']);
export const joinPolicy = pgEnum('join_policy', ['open', 'approval']);
export const sessionStatus = pgEnum('session_status', ['draft', 'open', 'live', 'ended', 'cancelled']);
export const sessionVisibility = pgEnum('session_visibility', ['club', 'invited']);
export const registrationStatus = pgEnum('registration_status', ['registered', 'waitlisted', 'cancelled']);
export const tier = pgEnum('tier', ['new', 'beginner', 'improver', 'intermediate', 'advanced', 'competitive']);

const ts = (name: string) => timestamp(name, { withTimezone: true });

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey(),
  email: text('email'),
  displayName: text('display_name'),
  locale: text('locale').notNull().default('en'),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
  deletedAt: ts('deleted_at'),
});

export const players = pgTable('players', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  accountId: uuid('account_id'),
  managedByAccountId: uuid('managed_by_account_id'),
  createdByClubId: uuid('created_by_club_id'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull().default(''),
  displayName: text('display_name').notNull(),
  ageBand: ageBand('age_band').notNull().default('adult'),
  selfTier: tier('self_tier'),
  gender: text('gender'),
  photoPath: text('photo_path'),
  preferences: jsonb('preferences').notNull().default({}),
  privacy: jsonb('privacy').notNull().default({ show_rating: false, in_rankings: true }),
  consentRecordedAt: ts('consent_recorded_at'),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
  deletedAt: ts('deleted_at'),
});

export const consents = pgTable('consents', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  accountId: uuid('account_id').notNull(),
  playerId: uuid('player_id'),
  kind: text('kind').notNull(),
  version: text('version').notNull(),
  agreedAt: ts('agreed_at').notNull().defaultNow(),
});

export const clubs = pgTable('clubs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  timeZone: text('time_zone').notNull().default('Asia/Dubai'),
  currency: char('currency', { length: 3 }).notNull().default('AED'),
  country: char('country', { length: 2 }).notNull().default('AE'),
  weekStart: smallint('week_start').notNull().default(1),
  joinPolicy: joinPolicy('join_policy').notNull().default('open'),
  joinCode: text('join_code').notNull(),
  juniorsAllowed: boolean('juniors_allowed').notNull().default(true),
  defaultFees: jsonb('default_fees').notNull().default({ member: 0, guest: 0, junior: 0 }),
  settings: jsonb('settings').notNull().default({}),
  createdBy: uuid('created_by').notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
  deletedAt: ts('deleted_at'),
});

export const clubMembers = pgTable(
  'club_members',
  {
    clubId: uuid('club_id').notNull(),
    playerId: uuid('player_id').notNull(),
    role: clubRole('role').notNull().default('player'),
    status: membershipStatus('status').notNull().default('active'),
    joinedAt: ts('joined_at').notNull().defaultNow(),
    removedAt: ts('removed_at'),
    requestedAt: ts('requested_at'),
    decidedBy: uuid('decided_by'),
  },
  (t) => [primaryKey({ columns: [t.clubId, t.playerId] })],
);

export const courts = pgTable('courts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clubId: uuid('club_id').notNull(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  archivedAt: ts('archived_at'),
});

export const auditLog = pgTable('audit_log', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  clubId: uuid('club_id'),
  actorAccountId: uuid('actor_account_id'),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id'),
  before: jsonb('before'),
  after: jsonb('after'),
  reason: text('reason'),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const clubInvites = pgTable('club_invites', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clubId: uuid('club_id').notNull(),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: ts('expires_at').notNull(),
  createdBy: uuid('created_by').notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
  acceptedAt: ts('accepted_at'),
  acceptedBy: uuid('accepted_by'),
  revokedAt: ts('revoked_at'),
});

export type Fees = { member: number; guest: number; junior: number };
export type Scoring = { pointsToWin: number; cap: number; winByTwo: boolean };

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clubId: uuid('club_id').notNull(),
  title: text('title').notNull(),
  venue: text('venue').notNull().default(''),
  startsAt: ts('starts_at').notNull(),
  endsAt: ts('ends_at').notNull(),
  capacity: integer('capacity').notNull(),
  format: text('format').notNull().default('doubles'),
  scoring: jsonb('scoring').$type<Scoring>().notNull(),
  preset: text('preset').$type<'social' | 'balanced' | 'competitive'>().notNull().default('balanced'),
  visibility: sessionVisibility('visibility').notNull().default('club'),
  registrationOpensAt: ts('registration_opens_at').notNull().defaultNow(),
  registrationClosesAt: ts('registration_closes_at').notNull(),
  fees: jsonb('fees').$type<Fees>().notNull(),
  standingsMethod: text('standings_method').notNull().default('win_pct'),
  minGamesToRank: smallint('min_games_to_rank').notNull().default(3),
  status: sessionStatus('status').notNull().default('open'),
  cancelledReason: text('cancelled_reason'),
  createdBy: uuid('created_by').notNull(),
  version: integer('version').notNull().default(1),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const sessionCourts = pgTable(
  'session_courts',
  {
    sessionId: uuid('session_id').notNull(),
    clubId: uuid('club_id').notNull(),
    courtId: uuid('court_id').notNull(),
    active: boolean('active').notNull().default(true),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.courtId] })],
);

export const sessionInvites = pgTable(
  'session_invites',
  { sessionId: uuid('session_id').notNull(), clubId: uuid('club_id').notNull(), playerId: uuid('player_id').notNull() },
  (t) => [primaryKey({ columns: [t.sessionId, t.playerId] })],
);

export const registrations = pgTable('registrations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid('session_id').notNull(),
  clubId: uuid('club_id').notNull(),
  playerId: uuid('player_id').notNull(),
  status: registrationStatus('status').notNull(),
  waitlistPosition: integer('waitlist_position'),
  registeredAt: ts('registered_at').notNull().defaultNow(),
  cancelledAt: ts('cancelled_at'),
  lateCancellation: boolean('late_cancellation').notNull().default(false),
  actedBy: uuid('acted_by'),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  accountId: uuid('account_id').notNull(),
  playerId: uuid('player_id'),
  clubId: uuid('club_id'),
  type: text('type').notNull(),
  payload: jsonb('payload').$type<Record<string, string | number | null>>().notNull().default({}),
  readAt: ts('read_at'),
  createdAt: ts('created_at').notNull().defaultNow(),
});
