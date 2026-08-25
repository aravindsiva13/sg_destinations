interface AdminIconProps {
  name: AdminIconName;
  className?: string;
}

export type AdminIconName =
  | 'dashboard'
  | 'bookings'
  | 'stays'
  | 'enquiries'
  | 'calendar'
  | 'logout'
  | 'menu'
  | 'search'
  | 'plus'
  | 'chevron'
  | 'check'
  | 'guests'
  | 'audit'
  | 'users'
  | 'settings'
  | 'content'
  | 'offers'
  | 'reviews'
  | 'banners'
  | 'pricing'
  | 'reports'
  | 'media'
  | 'download'
  | 'star'
  | 'alert';

const paths: Record<AdminIconName, JSX.Element> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  bookings: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 3v3M16 3v3" strokeLinecap="round" />
    </>
  ),
  stays: (
    <>
      <path d="M3 11l9-7 9 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9h14v-9" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  enquiries: (
    <>
      <path d="M21 12a8 8 0 1 1-3.2-6.4" strokeLinecap="round" />
      <path d="M21 5v4h-4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 3v3M16 3v3" strokeLinecap="round" />
    </>
  ),
  logout: (
    <>
      <path d="M15 12H3M3 12l4-4M3 12l4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9" strokeLinecap="round" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" strokeLinecap="round" />,
  chevron: <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />,
  check: <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />,
  guests: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6M18 20a5 5 0 0 0-3-4.6" strokeLinecap="round" />
    </>
  ),
  audit: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6M18 20a5 5 0 0 0-3-4.6" strokeLinecap="round" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" strokeLinecap="round" />
    </>
  ),
  content: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 13h8M8 16h5" strokeLinecap="round" />
    </>
  ),
  offers: (
    <>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2a2 2 0 0 1-.6-1.4V5a2 2 0 0 1 2-2h6.9a2 2 0 0 1 1.4.6l7.5 7.5a2 2 0 0 1 0 2.8z" strokeLinejoin="round" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </>
  ),
  reviews: (
    <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" strokeLinejoin="round" />
  ),
  banners: (
    <>
      <rect x="3" y="5" width="18" height="10" rx="2" />
      <path d="M7 19h10M9 15v4M15 15v4" strokeLinecap="round" />
    </>
  ),
  pricing: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 3v3M16 3v3M8 13h2M8 17h2M14 13h2M14 17h2" strokeLinecap="round" />
    </>
  ),
  reports: (
    <>
      <path d="M4 20V4M4 20h16" strokeLinecap="round" />
      <path d="M8 16v-4M12 16V8M16 16v-6" strokeLinecap="round" />
    </>
  ),
  media: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 17 5-5 4 4 3-3 4 4" strokeLinejoin="round" />
    </>
  ),
  download: (
    <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
  ),
  star: (
    <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" strokeLinejoin="round" />
  ),
  alert: (
    <>
      <path d="M12 4 2.5 20h19L12 4z" strokeLinejoin="round" />
      <path d="M12 10v4m0 3h.01" strokeLinecap="round" />
    </>
  ),
};

export default function AdminIcon({ name, className = 'h-5 w-5' }: AdminIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
      {paths[name]}
    </svg>
  );
}
