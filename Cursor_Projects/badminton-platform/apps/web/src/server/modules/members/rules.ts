/**
 * Who may do what to club members (product-requirements.md §3). Pure functions, fully unit-tested.
 * The database adds two hard rules: only account holders get roles above "player",
 * and a club always keeps at least one owner.
 */
export type Role = 'owner' | 'admin' | 'organiser' | 'player';

const RANK: Record<Role, number> = { player: 0, organiser: 1, admin: 2, owner: 3 };

export const ROLE_LABELS: Record<Role, string> = { owner: 'Owner', admin: 'Admin', organiser: 'Organiser', player: 'Player' };

/** Roles the actor may give to the target (empty = cannot change the target's role). */
export function assignableRoles(actor: Role, target: Role, isSelf: boolean): Role[] {
  if (actor === 'owner') {
    // Owners can set any role, including their own (the database keeps one owner).
    return ['owner', 'admin', 'organiser', 'player'];
  }
  if (actor === 'admin' && !isSelf && RANK[target] < RANK.admin) return ['organiser', 'player'];
  return [];
}

export function canChangeRole(actor: Role, target: Role, newRole: Role, isSelf: boolean): boolean {
  return newRole !== target && assignableRoles(actor, target, isSelf).includes(newRole);
}

/** Owners remove anyone; admins remove organisers and players; anyone may leave (remove themselves). */
export function canRemove(actor: Role, target: Role, isSelf: boolean): boolean {
  if (isSelf) return true;
  if (actor === 'owner') return true;
  if (actor === 'admin') return RANK[target] < RANK.admin;
  return false;
}

export const canManageMembers = (actor: Role) => actor === 'owner' || actor === 'admin';
export const canAddGuests = (actor: Role) => actor !== 'player';
export const canSeeEmails = (actor: Role) => actor === 'owner' || actor === 'admin';
