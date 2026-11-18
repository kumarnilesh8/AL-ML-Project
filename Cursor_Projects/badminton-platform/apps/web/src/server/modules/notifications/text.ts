/** Turns a stored notification into a sentence (payload holds names and times, never private data). */
export type NotificationPayload = Record<string, string | number | null>;

export function notificationText(type: string, p: NotificationPayload): string {
  const who = p.playerName ? `${p.playerName}` : 'You';
  const s = p.sessionTitle ?? 'the session';
  const when = p.when ? ` (${p.when})` : '';
  switch (type) {
    case 'registration_confirmed':
      return `${who} ${who === 'You' ? 'have' : 'has'} a place at ${s}${when}.`;
    case 'waitlisted':
      return `${s}${when} is full. ${who} ${who === 'You' ? 'are' : 'is'} number ${p.position} on the waiting list.`;
    case 'promoted':
      return `Good news: a place opened up. ${who} ${who === 'You' ? 'now have' : 'now has'} a place at ${s}${when}.`;
    case 'session_changed':
      return `${s} has changed: ${p.change}. Check the new details.`;
    case 'session_cancelled':
      return `${s}${when} has been cancelled.${p.reason ? ` Reason: ${p.reason}` : ''}`;
    case 'registration_removed':
      return `An organiser removed ${who === 'You' ? 'you' : who} from ${s}${when}.`;
    case 'registration_added':
      return `An organiser gave ${who === 'You' ? 'you' : who} a place at ${s}${when}.`;
    case 'moved_to_waitlist':
      return `${who} ${who === 'You' ? 'have' : 'has'} been moved to the waiting list for ${s} (number ${p.position}).`;
    case 'spot_free_after_close':
      return `A place became free at ${s}${when} after registration closed. Fill it from the registration list if you wish.`;
    default:
      return 'You have a new update.';
  }
}
