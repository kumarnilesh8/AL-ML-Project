/**
 * Time-zone helpers. All times are stored in UTC and shown in the club's time zone.
 * Works for zones with and without daylight saving (e.g. Asia/Dubai, Europe/London).
 */

function partsInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}

/** Minutes the zone is ahead of UTC at that instant (Dubai: +240). */
export function zoneOffsetMinutes(date: Date, timeZone: string): number {
  const p = partsInZone(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}

/** "2026-11-03" + "20:00" in a zone -> the UTC instant. */
export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const [hh, mm] = time.split(':').map(Number) as [number, number];
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  let utc = wall;
  for (let i = 0; i < 3; i++) utc = wall - zoneOffsetMinutes(new Date(utc), timeZone) * 60000;
  return new Date(utc);
}

/** The local calendar date and clock time of an instant in a zone. */
export function utcToZoned(date: Date, timeZone: string): { date: string; time: string } {
  const p = partsInZone(date, timeZone);
  const pad = (n: number) => String(n).padStart(2, '0');
  return { date: `${p.year}-${pad(p.month)}-${pad(p.day)}`, time: `${pad(p.hour)}:${pad(p.minute)}` };
}

/**
 * Session start and end from a local date and clock times.
 * An end time at or before the start time means the session ends the next day (e.g. 22:30–01:00).
 */
export function sessionTimes(date: string, startTime: string, endTime: string, timeZone: string): { startsAt: Date; endsAt: Date; endsNextDay: boolean } {
  const startsAt = zonedToUtc(date, startTime, timeZone);
  const endsNextDay = endTime <= startTime;
  let endDate = date;
  if (endsNextDay) {
    const [y, m, d] = date.split('-').map(Number) as [number, number, number];
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    endDate = next.toISOString().slice(0, 10);
  }
  return { startsAt, endsAt: zonedToUtc(endDate, endTime, timeZone), endsNextDay };
}

/** Short label for the zone: "UAE time" for Asia/Dubai, otherwise e.g. "GMT+1" or "BST". */
export function zoneLabel(timeZone: string, at: Date = new Date()): string {
  if (timeZone === 'Asia/Dubai') return 'UAE time';
  const part = new Intl.DateTimeFormat('en-GB', { timeZone, timeZoneName: 'short' }).formatToParts(at).find((p) => p.type === 'timeZoneName');
  return part?.value ?? timeZone;
}

/** "Tue 3 Nov, 8:00 pm" in the given zone. */
export function formatWhen(date: Date, timeZone: string): string {
  const day = new Intl.DateTimeFormat('en-GB', { timeZone, weekday: 'short', day: 'numeric', month: 'short' }).format(date);
  return `${day}, ${formatClock(date, timeZone)}`;
}

/** "8:00 pm" in the given zone. */
export function formatClock(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone, hour: 'numeric', minute: '2-digit', hour12: true }).format(date).replace(/\s?([ap])\.?m\.?/i, ' $1m').toLowerCase();
}

/** "Tue 3 Nov, 10:30 pm – 1:00 am (+1 day)" */
export function formatSessionRange(startsAt: Date, endsAt: Date, timeZone: string): string {
  const startDay = utcToZoned(startsAt, timeZone).date;
  const endDay = utcToZoned(endsAt, timeZone).date;
  return `${formatWhen(startsAt, timeZone)} – ${formatClock(endsAt, timeZone)}${startDay !== endDay ? ' (+1 day)' : ''}`;
}
