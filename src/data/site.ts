export const site = {
  name: 'Shraddha Garden',
  fullName: 'Shraddha Garden Resort',
  tagline: 'A sanctuary of celebration and stays',
  footerTagline:
    'A sanctuary of celebration and stays, blending modern luxury with natural serenity.',
  email: 'hello@shraddhagarden.com',
  phone: '+91 98941 99762',
  address: 'Coimbatore, Tamil Nadu, India',
} as const;

export interface NavLink {
  label: string;
  to: string;
}

export const navLinks: NavLink[] = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Amenities', to: '/amenities' },
  { label: 'Stays', to: '/stays' },
  { label: 'Dining', to: '/dining' },
  { label: 'Events', to: '/events' },
  { label: 'Offers', to: '/offers' },
  { label: 'Gallery', to: '/gallery' },
];

export const steps = [
  {
    no: '01',
    title: 'Call & reserve',
    text: 'Reach out and share your vision. We will check availability and hold your preferred date.',
  },
  {
    no: '02',
    title: 'Plan the day',
    text: 'Work with a dedicated host to shape every detail — décor, dining, stays and more.',
  },
  {
    no: '03',
    title: 'Celebrate',
    text: 'Arrive and simply enjoy. We handle everything on-site so you can be present.',
  },
];

/** Indian Rupee formatter. */
export const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
