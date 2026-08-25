interface IconProps {
  name: string;
  className?: string;
  strokeWidth?: number;
}

/**
 * Lightweight line-icon set drawn with stroked SVG paths so every icon
 * shares the same calm, hand-drawn weight used across the site.
 */
const paths: Record<string, JSX.Element> = {
  // UI
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  chevronUp: <path d="M6 15l6-6 6 6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  minus: <path d="M5 12h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  star: (
    <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" />
  ),
  check: <path d="M4 12l5 5L20 6" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </>
  ),
  map: (
    <>
      <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  phone: (
    <path d="M4 5c0 8.3 6.7 15 15 15a2 2 0 002-2v-2.5a1 1 0 00-.8-1l-3.6-.7a1 1 0 00-1 .5l-.8 1.3a12 12 0 01-5.2-5.2l1.3-.8a1 1 0 00.5-1l-.7-3.6a1 1 0 00-1-.8H6a2 2 0 00-2 2z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  location: (
    <>
      <path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0112 0M16 5a3 3 0 010 6M21 20a6 6 0 00-4-5.6" />
    </>
  ),
  // Amenities / stays
  snow: <path d="M12 3v18M5 6l14 12M19 6L5 18M3 12h18" />,
  snowflake: <path d="M12 3v18M5 6l14 12M19 6L5 18M3 12h18M9 4l3 2 3-2M9 20l3-2 3 2" />,
  bed: (
    <>
      <path d="M3 18v-7h14a4 4 0 014 4v3" />
      <path d="M3 11V7M3 18h18M7 11V9h4v2" />
    </>
  ),
  bath: (
    <>
      <path d="M4 12V6a2 2 0 012-2 2 2 0 012 2M3 12h18v3a4 4 0 01-4 4H7a4 4 0 01-4-4z" />
      <path d="M7 19l-1 2M18 19l1 2" />
    </>
  ),
  veranda: (
    <>
      <path d="M3 21V9l9-5 9 5v12" />
      <path d="M3 13h18M8 21v-6h8v6" />
    </>
  ),
  wifi: (
    <>
      <path d="M2 8.5a16 16 0 0120 0M5 12a11 11 0 0114 0M8 15.5a6 6 0 018 0" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
  dining: (
    <>
      <path d="M6 3v8a2 2 0 002 2v8M8 3v6M4 3v6M18 3c-2 0-3 2-3 5s1 4 3 4v9" />
    </>
  ),
  pool: (
    <>
      <path d="M3 17c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0M3 21c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 3-1 4.5 0" />
      <path d="M8 14V5a2 2 0 014 0M14 14V5" />
    </>
  ),
  waterfall: (
    <>
      <path d="M7 3v8M12 3v10M17 3v8" />
      <path d="M4 16c1.3.9 2.7.9 4 0s2.7-.9 4 0 2.7.9 4 0 2.7-.9 4 0M4 20c1.3.9 2.7.9 4 0s2.7-.9 4 0 2.7.9 4 0 2.7-.9 4 0" />
    </>
  ),
  sprinkler: (
    <>
      <path d="M12 12V6M12 6c-2-1-4-1-6 1M12 6c2-1 4-1 6 1" />
      <path d="M5 21c.8-3 1.5-5 2-6M19 21c-.8-3-1.5-5-2-6M12 13v8" />
    </>
  ),
  fountain: (
    <>
      <path d="M12 21V9M12 9c0-2 1.5-3 3-3M12 9c0-2-1.5-3-3-3M9 6a2 2 0 014.5-1M15 6a2 2 0 00-2.5-1" />
      <path d="M5 21h14M7 21l1-5h8l1 5" />
    </>
  ),
  pump: (
    <>
      <path d="M7 21V8l4-3v3h5M16 8v4M11 8h7" />
      <path d="M5 21h8" />
    </>
  ),
  theatre: (
    <>
      <rect x="3" y="5" width="18" height="12" rx="1" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  tower: (
    <>
      <path d="M9 21V7l3-4 3 4v14" />
      <path d="M9 11h6M9 15h6M6 21h12" />
    </>
  ),
  cabin: (
    <>
      <path d="M3 21V11l9-6 9 6v10" />
      <path d="M3 14h18M9 21v-5h6v5" />
    </>
  ),
  leaf: <path d="M4 20C4 11 11 4 20 4c0 9-7 16-16 16zM4 20c4-4 8-6 12-7" />,
  hut: (
    <>
      <path d="M3 20l9-13 9 13" />
      <path d="M6 20v-5h12v5M3 20h18" />
    </>
  ),
  hammock: (
    <>
      <path d="M2 8v8M22 8v8M3 12c4 4 14 4 18 0" />
    </>
  ),
  flower: (
    <>
      <circle cx="12" cy="9" r="2.2" />
      <path d="M12 7c0-3 3-3 3-1s-3 3-3 3M12 7c0-3-3-3-3-1s3 3 3 3M14 9c3 0 3 3 1 3s-3-3-3-3M10 9c-3 0-3 3-1 3s3-3 3-3M12 11v10" />
    </>
  ),
  palm: (
    <>
      <path d="M12 21V9M12 9c-3-3-7-2-8 0M12 9c3-3 7-2 8 0M12 9c-1-3-4-5-7-4M12 9c1-3 4-5 7-4" />
      <path d="M9 21h6" />
    </>
  ),
  racket: (
    <>
      <circle cx="9" cy="9" r="5" />
      <path d="M6 12l-3.5 3.5a2 2 0 102.8 2.8L9 15M7 9h4M9 7v4" />
    </>
  ),
  fire: (
    <path d="M12 3c1 3-1 4-1 6a3 3 0 003 3c1-1 1-2 1-2 2 2 2 4 2 5a5 5 0 11-10 0c0-3 2-4 2-6 1 1 2 1 3 0 1-2 0-4 0-6z" />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </>
  ),
};

export default function Icon({ name, className, strokeWidth = 1.5 }: IconProps) {
  const isFilled = name === 'star';
  return (
    <svg
      viewBox="0 0 24 24"
      fill={isFilled ? 'currentColor' : 'none'}
      stroke={isFilled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {paths[name] ?? paths.flower}
    </svg>
  );
}
