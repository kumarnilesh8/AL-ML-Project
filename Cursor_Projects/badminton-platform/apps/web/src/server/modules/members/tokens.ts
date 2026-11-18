import { createHash, randomBytes } from 'node:crypto';

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'; // no l, o, 0, 1: easy to read aloud

/** Short code for a club's join link, e.g. "k7m2qx9a4d". */
export function newJoinCode(length = 10): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

/** Personal invitation token: the raw token goes in the email; only its hash is stored. */
export function newInviteToken(): { token: string; hash: string } {
  const token = randomBytes(24).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
