import type { PrismaClient } from '@prisma/client';

const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

interface Item {
  type: 'AMENITY' | 'DINING' | 'EVENT' | 'OFFER';
  slug: string;
  title: string;
  category?: string;
  icon?: string;
  excerpt: string;
  body?: string[];
  heroImage: string;
  gallery?: string[];
  tags?: string[];
  priceLabel?: string;
  meta?: Record<string, unknown>;
  featured?: boolean;
  sortOrder?: number;
}

const amenity = (
  slug: string,
  title: string,
  category: string,
  icon: string,
  excerpt: string,
  heroImage: string,
  meta?: Record<string, unknown>,
): Item => ({ type: 'AMENITY', slug, title, category, icon, excerpt, heroImage, meta });

const AMENITIES: Item[] = [
  amenity('swimming-pool', 'Swimming Pool', 'Wellness', 'pool', 'A serene pool framed by greenery, lit softly at dusk.', u('1571896349842-33c89424de2d'), {
    whatToExpect: ['Evening ambient lighting', "Dedicated kids' shallow zone", 'Clean changing rooms nearby', 'Professional lifeguard on event days'],
    quickFacts: { bestFor: ['Birthday', 'Get-together', 'Engagement'], timings: '06:00 AM – 09:00 PM', safetyNote: 'Adult supervision required for children near the pool area.' },
  }),
  amenity('water-fall', 'Water Fall', 'Wellness', 'waterfall', 'A cascading feature bringing the sound of falling water to the garden.', u('1467890947394-8171244e5410')),
  amenity('water-sprinklers', 'Water Sprinklers', 'Play & Activities', 'sprinkler', 'Playful jets of water cooling the lawns on warm afternoons.', u('1563514227147-6d2ff665a6a0')),
  amenity('water-snow', 'Water Snow', 'Play & Activities', 'fountain', 'A delightful artificial snow play zone for children and adults.', u('1551582045-6ec9c11d8697')),
  amenity('water-fountain', 'Water Fountain', 'Scenery', 'fountain', 'An ornamental fountain anchoring the central courtyard.', u('1518972559570-7cc1309f3229')),
  amenity('traditional-pump-set', 'Traditional Pump Set', 'Heritage', 'pump', 'A heritage hand pump celebrating rural Tamil tradition.', u('1500382017468-9049fed747ef')),
  amenity('theatre-house', 'Theatre House', 'Play & Activities', 'theatre', 'An open-air theatre house for screenings and performances.', u('1517604931442-7e0c8ed2963c')),
  amenity('tower-house', 'Tower House', 'Stays', 'tower', 'An elevated retreat with panoramic garden views.', u('1582719478250-c89cae4dc85b')),
  amenity('wood-house', 'Wood House', 'Stays', 'cabin', 'A timber sanctuary wrapped in foliage.', u('1518780664697-55e3ad937233')),
  amenity('jividha', 'Jividha', 'Wellness', 'hammock', 'A tranquil wellness corner for yoga and quiet mornings.', u('1545389336-cf090694435e')),
  amenity('kudil', 'Kudil', 'Heritage', 'hut', 'A modern ode to the traditional Tamil dwelling.', u('1520250497591-112f2f40a3f4')),
  amenity('chillax-bay', 'Chillax Bay', 'Play & Activities', 'hammock', 'A laid-back lounge bay for unwinding with friends.', u('1529290130-4ca3753253ae')),
  amenity('garden', 'Garden', 'Scenery', 'flower', 'Acres of manicured lawns and lush, layered planting.', u('1558616629-899031969d5e')),
  amenity('coconut-farm', 'Coconut Farm', 'Scenery', 'palm', 'A working coconut grove threading through the grounds.', u('1574482620811-1aa16ffe3c82')),
  amenity('shuttle-court', 'Shuttle Court', 'Play & Activities', 'racket', 'A well-kept badminton court for friendly matches.', u('1626224583764-f87db24ac4ea')),
  amenity('camp-fire-with-dj', 'Camp Fire with DJ', 'Play & Activities', 'fire', 'Evenings around the fire with music and a live DJ.', u('1475483768296-6163e08872a1'), {
    whatToExpect: ['Crackling bonfire setup', 'Live DJ and sound system', 'Seating around the fire', 'Marshmallow roasting on request'],
    quickFacts: { bestFor: ['Get-together', 'Birthday', 'Corporate'], timings: '07:00 PM – 11:00 PM' },
  }),
];

const DINING: Item[] = [
  { type: 'DINING', slug: 'south-indian-feast', title: 'South Indian Feast', category: 'Tamil', excerpt: 'Banana-leaf meals rooted in authentic Tamil tradition.', heroImage: u('1630383249896-424e482df921'), priceLabel: '₹650', tags: ['Veg', 'Signature'], sortOrder: 0 },
  { type: 'DINING', slug: 'garden-grill', title: 'Garden Grill', category: 'Continental', excerpt: 'Open-air grills and wood-fired flavours under the stars.', heroImage: u('1555939594-58d7cb561ad1'), priceLabel: '₹900', tags: ['Non-veg'], sortOrder: 1 },
  { type: 'DINING', slug: 'cafe-mornings', title: 'Café Mornings', category: 'Café', excerpt: 'Filter coffee, fresh bakes and slow garden breakfasts.', heroImage: u('1504674900247-0877df9cc836'), priceLabel: '₹350', tags: ['All-day'], sortOrder: 2 },
];

const EVENTS: Item[] = [
  { type: 'EVENT', slug: 'weddings', title: 'Weddings', category: 'Celebration', excerpt: 'Garden weddings with space for up to 500 guests.', heroImage: u('1519225421980-715cb0215aed'), tags: ['Up to 500'], sortOrder: 0, featured: true },
  { type: 'EVENT', slug: 'birthdays', title: 'Birthdays', category: 'Celebration', excerpt: 'Themed birthday celebrations for all ages.', heroImage: u('1530103862676-de8c9debad1d'), sortOrder: 1 },
  { type: 'EVENT', slug: 'corporate', title: 'Corporate', category: 'Business', excerpt: 'Offsites, conferences and team retreats with stays.', heroImage: u('1511795409834-ef04bbd61622'), sortOrder: 2 },
  { type: 'EVENT', slug: 'get-togethers', title: 'Get-togethers', category: 'Celebration', excerpt: 'Reunions and gatherings amidst the gardens.', heroImage: u('1529543544282-cc3ac8b5c4a0'), sortOrder: 3 },
];

const OFFERS: Item[] = [
  { type: 'OFFER', slug: 'honeymoon-retreat', title: 'Honeymoon Retreat', category: 'Couples', excerpt: '2 nights with private dinner and spa for two.', heroImage: u('1582719508461-905c673771fd'), priceLabel: 'From ₹32,000', tags: ['2 nights', 'Spa'], sortOrder: 0, featured: true },
  { type: 'OFFER', slug: 'weekend-escape', title: 'Weekend Escape', category: 'Weekend', excerpt: 'Fri–Sun garden stay with breakfast included.', heroImage: u('1571003123894-1f0594d2b5d9'), priceLabel: 'From ₹18,000', tags: ['Weekend'], sortOrder: 1 },
  { type: 'OFFER', slug: 'festive-package', title: 'Festive Package', category: 'Seasonal', excerpt: 'Celebrate the season with a curated festive stay.', heroImage: u('1512389142860-9c449e58a543'), priceLabel: 'From ₹40,000', tags: ['Festive'], sortOrder: 2 },
];

const ALL = [...AMENITIES, ...DINING, ...EVENTS, ...OFFERS];

const COUPONS = [
  { code: 'WELCOME10', description: '10% off your first stay', kind: 'PERCENT', value: 10, minAmount: 10000, maxDiscount: 5000, usageLimit: 1000, active: true },
  { code: 'FESTIVE25', description: '25% off festive bookings (max ₹8,000)', kind: 'PERCENT', value: 25, minAmount: 20000, maxDiscount: 8000, active: true },
  { code: 'FLAT2000', description: '₹2,000 off stays above ₹15,000', kind: 'FLAT', value: 2000, minAmount: 15000, active: true },
];

const BANNERS = [
  { type: 'ANNOUNCEMENT', title: '✦ Monsoon offer — 20% off weekday stays. Use code WELCOME10', ctaLabel: 'View offers', ctaHref: '/offers', sortOrder: 0 },
  { type: 'HERO', title: 'Celebrate amidst lush green gardens', subtitle: 'A sanctuary of celebration and stays.', imageUrl: u('1505691938895-1758d7feb511'), ctaLabel: 'Check availability', ctaHref: '/reserve', sortOrder: 0 },
  { type: 'HERO', title: 'Rooted in Tamil tradition', subtitle: 'Where heritage meets modern luxury.', imageUrl: u('1466692476868-aef1dfb1e735'), ctaLabel: 'Explore stays', ctaHref: '/stays', sortOrder: 1 },
];

const REVIEWS = [
  { author: 'Anaya Rao', rating: 5, title: 'A magical wedding venue', body: 'We hosted our wedding here and it was beyond beautiful. The gardens, the staff, everything was perfect.', status: 'APPROVED' },
  { author: 'Rohan Mehta', rating: 5, title: 'Peaceful weekend', body: 'The Wood House was so serene. Woke up to birdsong and greenery. Will be back.', status: 'APPROVED' },
  { author: 'Priya Nair', rating: 4, title: 'Lovely stay', body: 'Great food and lovely grounds. Highly recommend the south Indian feast.', status: 'APPROVED' },
  { author: 'New Guest', email: 'pending@example.com', rating: 5, title: 'Awaiting moderation', body: 'This review is pending approval in the admin queue.', status: 'PENDING' },
];

/** Idempotently (re)seed content, coupons, banners and reviews. */
export async function seedContent(prisma: PrismaClient) {
  await prisma.contentItem.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.review.deleteMany();

  for (const it of ALL) {
    await prisma.contentItem.create({
      data: {
        type: it.type,
        slug: it.slug,
        title: it.title,
        category: it.category ?? null,
        icon: it.icon ?? null,
        excerpt: it.excerpt,
        body: JSON.stringify(it.body ?? [it.excerpt]),
        heroImage: it.heroImage,
        gallery: JSON.stringify(it.gallery ?? []),
        tags: JSON.stringify(it.tags ?? []),
        priceLabel: it.priceLabel ?? null,
        meta: JSON.stringify(it.meta ?? {}),
        featured: it.featured ?? false,
        sortOrder: it.sortOrder ?? 0,
      },
    });
  }

  await prisma.coupon.createMany({ data: COUPONS });
  await prisma.banner.createMany({ data: BANNERS });
  await prisma.review.createMany({ data: REVIEWS });

  return { content: ALL.length, coupons: COUPONS.length, banners: BANNERS.length, reviews: REVIEWS.length };
}
