import { describe, expect, it } from 'vitest';
import { assignableRoles, canAddGuests, canChangeRole, canRemove, canSeeEmails, type Role } from './rules';

const ROLES: Role[] = ['owner', 'admin', 'organiser', 'player'];

describe('role changes', () => {
  it('owners can assign any role', () => {
    for (const t of ROLES) expect(assignableRoles('owner', t, false)).toEqual(ROLES);
  });
  it('admins can only move organisers and players between those two roles', () => {
    expect(canChangeRole('admin', 'player', 'organiser', false)).toBe(true);
    expect(canChangeRole('admin', 'organiser', 'player', false)).toBe(true);
    expect(canChangeRole('admin', 'player', 'admin', false)).toBe(false);
    expect(canChangeRole('admin', 'admin', 'player', false)).toBe(false);
    expect(canChangeRole('admin', 'owner', 'player', false)).toBe(false);
    expect(canChangeRole('admin', 'admin', 'player', true)).toBe(false);
  });
  it('organisers and players cannot change roles', () => {
    for (const actor of ['organiser', 'player'] as Role[])
      for (const t of ROLES) for (const n of ROLES) expect(canChangeRole(actor, t, n, false)).toBe(false);
  });
  it('setting the same role is not a change', () => {
    expect(canChangeRole('owner', 'player', 'player', false)).toBe(false);
  });
});

describe('removing members', () => {
  it('follows the permission table', () => {
    expect(canRemove('owner', 'admin', false)).toBe(true);
    expect(canRemove('admin', 'organiser', false)).toBe(true);
    expect(canRemove('admin', 'admin', false)).toBe(false);
    expect(canRemove('admin', 'owner', false)).toBe(false);
    expect(canRemove('organiser', 'player', false)).toBe(false);
    expect(canRemove('player', 'player', true)).toBe(true); // leaving the club
  });
});

describe('other permissions', () => {
  it('guests can be added by organisers and above; emails seen by owners and admins', () => {
    expect(ROLES.filter(canAddGuests)).toEqual(['owner', 'admin', 'organiser']);
    expect(ROLES.filter(canSeeEmails)).toEqual(['owner', 'admin']);
  });
});
