import { serializeStay } from '../serialize.js';
import type { Stay } from '@prisma/client';

/** A synthetic Stay row with the JSON-string columns packed like the DB. */
export function makeStayRow(overrides: Partial<Stay> = {}): Stay {
  return {
    id: 's1',
    slug: 'garden-villa',
    name: 'Garden Villa',
    badge: null,
    pricePerNight: 4500,
    rating: 4.8,
    shortIntro: 'A quiet retreat',
    description: JSON.stringify(['A private villa with a garden.']),
    heroImage: 'https://example.com/main.jpg',
    gallery: JSON.stringify(['https://example.com/g.jpg']),
    amenities: JSON.stringify([{ label: 'Pool', icon: 'pool' }]),
    capacity: 4,
    beds: '2 Double Beds',
    inventory: 1,
    featured: false,
    published: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

/** The expected API shape produced by serializeStay for makeStayRow(). */
export function makeSerializedStay() {
  return serializeStay(makeStayRow());
}
