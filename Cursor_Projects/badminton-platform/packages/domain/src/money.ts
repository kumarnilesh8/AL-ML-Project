/** Money is stored in minor units (fils for AED). */

/** "30" or "30.50" (major units, as typed) -> 3000 / 3050 minor units; null if invalid. */
export function parseMoney(input: string): number | null {
  const s = input.trim();
  if (s === '') return 0;
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

/** 3000, 'AED' -> "AED 30" ; 3050 -> "AED 30.50" ; 0 -> "Free" */
export function formatMoney(minor: number, currency: string): string {
  if (minor === 0) return 'Free';
  const major = minor / 100;
  const text = Number.isInteger(major) ? String(major) : major.toFixed(2);
  return `${currency} ${text}`;
}
