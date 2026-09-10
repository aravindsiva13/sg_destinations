import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const realAmenities = [
  {
    slug: 'swimming-pool',
    title: 'Swimming Pool',
    category: 'Wellness',
    icon: 'pool',
    excerpt: 'A serene pool, gently lit and designed for relaxation.',
    heroImage: '/images/selected-images/new/pool_wide.jpeg',
    gallery: [
      '/images/selected-images/new/pool_angle.jpeg',
      '/images/selected-images/new/pool_wide.jpeg',
      '/images/selected-images/new/pool_wide_2.jpeg',
    ],
    body: [
      'The Swimming Pool at Shraddha Garden is the centrepiece of leisure — a glassy expanse framed by lush planting and warm ambient lighting. Whether you are gliding through the water at dawn or unwinding poolside at dusk, the pool offers a tranquil, restorative escape.',
    ],
    tags: ['Water', 'Wellness', 'Signature'],
    sortOrder: 0,
    meta: {
      whatToExpect: ['Evening ambient lighting', "Dedicated kids' shallow zone", 'Clean changing rooms nearby', 'Professional lifeguard on event days'],
      quickFacts: { bestFor: ['Birthday', 'Get-together', 'Engagement'], timings: '06:00 AM – 09:00 PM', safetyNote: 'Adult supervision required for children near the pool area.' },
    },
  },
  {
    slug: 'water-fall',
    title: 'Water Fall',
    category: 'Nature',
    icon: 'waterfall',
    excerpt: 'A cascading feature bringing the sound of nature.',
    heroImage: '/images/selected-images/new/water_shower.jpeg',
    gallery: [
      '/images/selected-images/new/water_shower.jpeg',
      '/images/selected-images/new/shra_vanam.jpeg',
    ],
    body: [
      'A property of beauty, the Water Fall is a striking natural composition — a sculpted cascade tumbling over rock into a clear pool below. It is a meditative backdrop and a memorable photo spot in equal measure.',
    ],
    tags: ['Water', 'Nature'],
    sortOrder: 1,
    meta: {
      whatToExpect: ['Gentle ambient sound', 'Photogenic rock landscaping', 'Evening illumination', 'Shaded seating nearby'],
      quickFacts: { bestFor: ['Photoshoot', 'Get-together', 'Wedding'], timings: '06:00 AM – 08:00 PM', safetyNote: 'Rocks may be slippery — please tread carefully.' },
    },
  },
  {
    slug: 'water-sprinklers',
    title: 'Water Sprinklers',
    category: 'Play & Activities',
    icon: 'sprinkler',
    excerpt: 'Playful jets of water cooling the garden lawns.',
    heroImage: '/images/selected-images/new/water_shower_square.jpeg',
    gallery: [
      '/images/selected-images/new/water_shower_square.jpeg',
      '/images/selected-images/new/water_shower.jpeg',
    ],
    body: [
      'Our playful Water Sprinklers turn the lawn into a joyful splash zone for children and the young at heart, especially welcome on warm afternoons.',
    ],
    tags: ['Water', 'Play'],
    sortOrder: 2,
    meta: {
      whatToExpect: ['Timed play sessions', 'Soft lawn surface', 'Towels on request', 'Supervised zones'],
      quickFacts: { bestFor: ['Birthday', 'Kids party'], timings: '09:00 AM – 06:00 PM', safetyNote: 'Supervision recommended for young children.' },
    },
  },
  {
    slug: 'water-snow',
    title: 'Water Snow',
    category: 'Play & Activities',
    icon: 'fountain',
    excerpt: 'A magical artificial snow experience for celebrations.',
    heroImage: '/images/selected-images/new/shra_vanam.jpeg',
    gallery: [
      '/images/selected-images/new/shra_vanam.jpeg',
      '/images/selected-images/new/pool_angle.jpeg',
    ],
    body: [
      'A crowd favourite at celebrations, the Water Snow effect blankets the festivities in a soft, magical flurry — perfect for grand entrances and finales.',
    ],
    tags: ['Water', 'Celebrations'],
    sortOrder: 3,
    meta: {
      whatToExpect: ['On-demand snow effect', 'Safe foam formula', 'Great for photos', 'Operator on hand'],
      quickFacts: { bestFor: ['Birthday', 'Wedding', 'Reception'], timings: 'On event request', safetyNote: 'Operated only by trained staff.' },
    },
  },
  {
    slug: 'water-fountain',
    title: 'Water Fountain',
    category: 'Nature',
    icon: 'fountain',
    excerpt: 'An elegant fountain anchoring the central courtyard.',
    heroImage: '/images/selected-images/new/shra_vanam.jpeg',
    gallery: [
      '/images/selected-images/new/shra_vanam.jpeg',
      '/images/selected-images/new/water_shower.jpeg',
    ],
    body: [
      'The central Water Fountain is a graceful focal point, its tiers catching the light by day and glowing softly after dark.',
    ],
    tags: ['Water', 'Scenery'],
    sortOrder: 4,
    meta: {
      whatToExpect: ['Choreographed water', 'Evening lighting', 'Courtyard seating', 'Photo-ready backdrop'],
      quickFacts: { bestFor: ['Engagement', 'Photoshoot'], timings: '06:00 AM – 10:00 PM', safetyNote: 'Please do not climb the fountain ledges.' },
    },
  },
  {
    slug: 'theatre-house',
    title: 'Theatre House',
    category: 'Play & Activities',
    icon: 'theatre',
    excerpt: 'A cosy screening house for films and presentations.',
    heroImage: '/images/selected-images/new/shraddha_cinemas.jpeg',
    gallery: [
      '/images/selected-images/new/shraddha_cinemas.jpeg',
      '/images/selected-images/new/theatre_front.jpeg',
    ],
    body: [
      'The Theatre House is an intimate screening space ideal for movie nights, slideshows and presentations, with comfortable seating and crisp projection.',
    ],
    tags: ['Entertainment', 'Indoor'],
    sortOrder: 5,
    meta: {
      whatToExpect: ['HD projection', 'Surround sound', 'Comfortable seating', 'Climate controlled'],
      quickFacts: { bestFor: ['Movie night', 'Corporate', 'Birthday'], timings: '10:00 AM – 11:00 PM', safetyNote: 'Please keep aisles clear at all times.' },
    },
  },
  {
    slug: 'tower-house',
    title: 'Tower House',
    category: 'Stays',
    icon: 'tower',
    excerpt: 'An elevated retreat with panoramic garden views.',
    heroImage: '/images/selected-images/new/elevated_stay.jpeg',
    gallery: [
      '/images/selected-images/new/elevated_stay.jpeg',
      '/images/stays/tower-house/7L3A9399.webp',
      '/images/stays/tower-house/7L3A9400.webp',
    ],
    body: [
      'Rising above the canopy, the Tower House offers panoramic views of the gardens and a serene perch from which to take in the resort.',
    ],
    tags: ['Stay', 'View'],
    sortOrder: 6,
    meta: {
      whatToExpect: ['Panoramic views', 'Private balcony', 'Air conditioning', 'Premium linens'],
      quickFacts: { bestFor: ['Honeymoon', 'Anniversary'], timings: 'Check-in 02:00 PM', safetyNote: 'Mind the steps on the upper deck.' },
    },
  },
  {
    slug: 'wood-house',
    title: 'Wood House',
    category: 'Stays',
    icon: 'cabin',
    excerpt: 'A timber cabin wrapped in tranquil greenery.',
    heroImage: '/images/stays/wood-house-1/7L3A9320.webp',
    gallery: [
      '/images/stays/wood-house-1/7L3A9320.webp',
      '/images/stays/wood-house-1/7L3A9324.webp',
      '/images/stays/wood-house-1/7L3A9341.webp',
    ],
    body: [
      'A timber sanctuary designed for blissful seclusion, the Wood House pairs natural finishes with quiet, restorative comfort.',
    ],
    tags: ['Stay', 'Cabin'],
    sortOrder: 7,
    meta: {
      whatToExpect: ['Timber interiors', 'Expansive veranda', 'Air conditioning', 'Forest views'],
      quickFacts: { bestFor: ['Couples', 'Weekend retreat'], timings: 'Check-in 02:00 PM', safetyNote: 'Open flames are not permitted indoors.' },
    },
  },
  {
    slug: 'garden',
    title: 'Garden',
    category: 'Nature',
    icon: 'flower',
    excerpt: 'Acres of manicured lawns and botanical beauty.',
    heroImage: '/images/selected-images/Events/7L3A1899.JPG',
    gallery: [
      '/images/selected-images/Events/7L3A1899.JPG',
      '/images/selected-images/new/pool_wide_2.jpeg',
    ],
    body: [
      'At the heart of it all, the Garden is acres of manicured lawn, flowering borders and shaded walks — the living canvas for every celebration.',
    ],
    tags: ['Nature', 'Lush'],
    sortOrder: 8,
    meta: {
      whatToExpect: ['Manicured lawns', 'Flowering borders', 'Shaded walks', 'Event-ready spaces'],
      quickFacts: { bestFor: ['Wedding', 'Get-together', 'Photoshoot'], timings: '06:00 AM – 09:00 PM', safetyNote: 'Please keep off the freshly seeded areas.' },
    },
  },
  {
    slug: 'camp-fire-with-dj',
    title: 'Camp Fire with DJ',
    category: 'Play & Activities',
    icon: 'fire',
    excerpt: 'Evenings around the fire with music and a live DJ.',
    heroImage: '/images/selected-images/new/event_seating_night.jpeg',
    gallery: [
      '/images/selected-images/new/event_seating_night.jpeg',
      '/images/selected-images/Events/7L3A1933.JPG',
    ],
    body: [
      'End the day around a crackling Camp Fire with DJ — warm flames, great music and the open sky make for unforgettable evenings under the stars.',
    ],
    tags: ['Night', 'Music'],
    sortOrder: 9,
    meta: {
      whatToExpect: ['Bonfire setup', 'Live DJ', 'Seating around fire', 'Late-night music'],
      quickFacts: { bestFor: ['Birthday', 'Get-together', 'Wedding'], timings: '07:00 PM – 12:00 AM', safetyNote: 'Maintain a safe distance from the fire pit.' },
    },
  },
];

async function main() {
  console.log('Upserting all amenities with real local images into database...');

  for (const item of realAmenities) {
    await prisma.contentItem.upsert({
      where: {
        type_slug: {
          type: 'AMENITY',
          slug: item.slug,
        },
      },
      update: {
        title: item.title,
        category: item.category,
        icon: item.icon,
        excerpt: item.excerpt,
        body: JSON.stringify(item.body),
        heroImage: item.heroImage,
        gallery: JSON.stringify(item.gallery),
        tags: JSON.stringify(item.tags),
        meta: JSON.stringify(item.meta),
        sortOrder: item.sortOrder,
        published: true,
      },
      create: {
        type: 'AMENITY',
        slug: item.slug,
        title: item.title,
        category: item.category,
        icon: item.icon,
        excerpt: item.excerpt,
        body: JSON.stringify(item.body),
        heroImage: item.heroImage,
        gallery: JSON.stringify(item.gallery),
        tags: JSON.stringify(item.tags),
        meta: JSON.stringify(item.meta),
        sortOrder: item.sortOrder,
        published: true,
      },
    });
    console.log(`✓ Upserted amenity: ${item.slug}`);
  }

  console.log('Done updating amenity images!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
