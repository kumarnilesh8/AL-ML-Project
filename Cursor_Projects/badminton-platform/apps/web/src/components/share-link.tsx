'use client';
import { useState } from 'react';

/** Shows a link with Copy and (on phones) Share buttons. */
export function ShareLink({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;
  return (
    <div>
      <p className="break-all rounded-lg border border-line bg-surface px-4 py-3 font-semibold">{url}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary min-h-11"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          }}
        >
          {copied ? 'Copied' : 'Copy link'}
        </button>
        {canShare && (
          <button type="button" className="btn-quiet min-h-11" onClick={() => navigator.share({ title, text: `Join ${title} on Club sessions`, url }).catch(() => {})}>
            Share…
          </button>
        )}
      </div>
    </div>
  );
}
