/** A badminton court drawn in white lines: the product's visual signature. Decorative only. */
export function CourtMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 134 61" className={className} aria-hidden="true" focusable="false">
      <rect x="0" y="0" width="134" height="61" rx="2" fill="var(--court)" />
      <g fill="none" stroke="var(--on-court)" strokeWidth="0.9" opacity="0.95">
        <rect x="3" y="3" width="128" height="55" />
        <line x1="3" y1="7.6" x2="131" y2="7.6" />
        <line x1="3" y1="53.4" x2="131" y2="53.4" />
        <line x1="10.6" y1="3" x2="10.6" y2="58" />
        <line x1="123.4" y1="3" x2="123.4" y2="58" />
        <line x1="47.2" y1="3" x2="47.2" y2="58" />
        <line x1="86.8" y1="3" x2="86.8" y2="58" />
        <line x1="10.6" y1="30.5" x2="47.2" y2="30.5" />
        <line x1="86.8" y1="30.5" x2="123.4" y2="30.5" />
      </g>
      <line x1="67" y1="0" x2="67" y2="61" stroke="var(--on-court)" strokeWidth="1.6" strokeDasharray="1.6 1.2" />
    </svg>
  );
}
