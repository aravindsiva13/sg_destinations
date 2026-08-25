export interface Stat {
  value: string;
  label: string;
}

export const stats: Stat[] = [
  { value: '40+', label: 'Acres of garden' },
  { value: '16', label: 'Curated attractions' },
  { value: '24/7', label: 'On-site concierge' },
  { value: '100%', label: 'Celebrations remembered' },
];

export const handledOnSite: string[] = [
  'Event planning & coordination',
  'Catering & live kitchens',
  'Décor & floral styling',
  'Stage, sound & lighting',
  'Photography & videography',
  'Guest accommodation',
  'Valet & parking',
  'Housekeeping & maintenance',
  'Security & safety',
  'Dedicated celebration host',
];
