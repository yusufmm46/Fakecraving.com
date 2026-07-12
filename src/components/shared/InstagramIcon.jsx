import { useId } from "react";

// Real Instagram brand glyph (rounded-square gradient badge + camera ring +
// lens dot), not a monochrome outline -- gradient stops match Instagram's
// own icon (yellow -> pink/red -> purple). useId() keeps the gradient's id
// unique per instance since this renders in both the sidebar and footer.
export default function InstagramIcon({ size = 18, className = "" }) {
  const gradientId = `ig-gradient-${useId()}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={gradientId} cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#FDF497" />
          <stop offset="5%" stopColor="#FDF497" />
          <stop offset="45%" stopColor="#FD5949" />
          <stop offset="60%" stopColor="#D6249F" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="22" height="22" rx="6" fill={`url(#${gradientId})`} />
      <circle cx="12" cy="12" r="5" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="17.4" cy="6.6" r="1.15" fill="#fff" />
    </svg>
  );
}
