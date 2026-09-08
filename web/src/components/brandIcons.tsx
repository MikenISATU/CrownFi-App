// Brand icons for the wallet chooser. Inline SVG keeps the chooser available without
// external image requests.

// Base mark: a white circular form on Base blue.
export function BaseMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" width="36" height="36" className={className} aria-hidden>
      <rect width="40" height="40" rx="11" fill="#0052FF" />
      <path fill="#fff" d="M20 8a12 12 0 1 1-11.31 16H24a4.4 4.4 0 1 0 0-8H8.69A12 12 0 0 1 20 8Z" />
    </svg>
  );
}

// Google "G" — the accurate 4-colour mark (used for the email/Google login option).
export function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" className={className} aria-hidden>
      <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.55-5.17 3.55-8.87z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}
