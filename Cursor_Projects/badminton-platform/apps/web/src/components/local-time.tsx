'use client';
import { useEffect, useState } from 'react';

/** Adds "(5:00 pm your time)" when the viewer's device is in a different time zone from the club. */
export function LocalTime({ iso, clubTimeZone }: { iso: string; clubTimeZone: string }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    const mine = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (mine === clubTimeZone) return;
    const t = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, weekday: 'short' }).format(new Date(iso));
    setText(`${t.toLowerCase()} your time`);
  }, [iso, clubTimeZone]);
  return text ? <span className="text-muted"> ({text})</span> : null;
}
