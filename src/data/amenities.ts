import { images } from './images';

export type AmenityCategory =
  | 'Wellness'
  | 'Play & Activities'
  | 'Stays'
  | 'Nature';

export interface AmenityItem {
  slug: string;
  title: string;
  icon: string;
  category: AmenityCategory;
  blurb: string;
  tag: string;
  heroImage: string;
  gallery: string[];
  expect: string[];
  bestFor: string[];
  timings: string;
  safetyNote: string;
  description: string;
}

export const amenities: AmenityItem[] = [
  {
    slug: 'swimming-pool',
    title: 'Swimming Pool',
    icon: 'pool',
    category: 'Wellness',
    tag: 'Water',
    blurb: 'A serene pool, gently lit and designed for relaxation.',
    heroImage: images.swimmingPool,
    gallery: [images.poolNight, images.swimmingPool],
    description:
      'The Swimming Pool at Shraddha Garden is the centrepiece of leisure — a glassy expanse framed by lush planting and warm ambient lighting. Whether you are gliding through the water at dawn or unwinding poolside at dusk, the pool offers a tranquil, restorative escape. Every detail, from the ambient design and careful attention to detail make this amenity a central feature of the resort’s luxurious experience.',
    expect: [
      'Evening ambient lighting',
      "Dedicated kids' shallow zone",
      'Clean changing rooms nearby',
      'Professional lifeguard on event days',
    ],
    bestFor: ['Birthday', 'Get-together', 'Engagement'],
    timings: '06:00 AM – 09:00 PM',
    safetyNote:
      'Adult supervision required for kids at all times near the pool area.',
  },
  {
    slug: 'water-fall',
    title: 'Water Fall',
    icon: 'waterfall',
    category: 'Nature',
    tag: 'Water',
    blurb: 'A cascading feature bringing the sound of nature.',
    heroImage: images.waterFall,
    gallery: [images.waterFall, images.fountain],
    description:
      'A property of beauty, the Water Fall is a striking natural composition — a sculpted cascade tumbling over rock into a clear pool below. It is a meditative backdrop and a memorable photo spot in equal measure.',
    expect: [
      'Gentle ambient sound',
      'Photogenic rock landscaping',
      'Evening illumination',
      'Shaded seating nearby',
    ],
    bestFor: ['Photoshoot', 'Get-together', 'Wedding'],
    timings: '06:00 AM – 08:00 PM',
    safetyNote: 'Rocks may be slippery — please tread carefully.',
  },
  {
    slug: 'water-sprinklers',
    title: 'Water Sprinklers',
    icon: 'sprinkler',
    category: 'Play & Activities',
    tag: 'Water',
    blurb: 'Playful jets of water cooling the garden lawns.',
    heroImage: images.sprinklers,
    gallery: [images.sprinklers, images.garden],
    description:
      'Our playful Water Sprinklers turn the lawn into a joyful splash zone for children and the young at heart, especially welcome on warm afternoons.',
    expect: ['Timed play sessions', 'Soft lawn surface', 'Towels on request', 'Supervised zones'],
    bestFor: ['Birthday', 'Kids party'],
    timings: '09:00 AM – 06:00 PM',
    safetyNote: 'Supervision recommended for young children.',
  },
  {
    slug: 'water-snow',
    title: 'Water Snow',
    icon: 'snowflake',
    category: 'Play & Activities',
    tag: 'Water',
    blurb: 'A magical artificial snow experience for celebrations.',
    heroImage: images.fountain,
    gallery: [images.fountain, images.sprinklers],
    description:
      'A crowd favourite at celebrations, the Water Snow effect blankets the festivities in a soft, magical flurry — perfect for grand entrances and finales.',
    expect: ['On-demand snow effect', 'Safe foam formula', 'Great for photos', 'Operator on hand'],
    bestFor: ['Birthday', 'Wedding', 'Reception'],
    timings: 'On event request',
    safetyNote: 'Operated only by trained staff.',
  },
  {
    slug: 'water-fountain',
    title: 'Water Fountain',
    icon: 'fountain',
    category: 'Nature',
    tag: 'Water',
    blurb: 'An elegant fountain anchoring the central courtyard.',
    heroImage: images.fountain,
    gallery: [images.fountain, images.garden],
    description:
      'The central Water Fountain is a graceful focal point, its tiers catching the light by day and glowing softly after dark.',
    expect: ['Choreographed water', 'Evening lighting', 'Courtyard seating', 'Photo-ready backdrop'],
    bestFor: ['Engagement', 'Photoshoot'],
    timings: '06:00 AM – 10:00 PM',
    safetyNote: 'Please do not climb the fountain ledges.',
  },
  {
    slug: 'traditional-pump-set',
    title: 'Traditional Pump Set',
    icon: 'pump',
    category: 'Nature',
    tag: 'Heritage',
    blurb: 'A nostalgic hand-pump set amid the gardens.',
    heroImage: images.garden,
    gallery: [images.garden, images.coconutFarm],
    description:
      'A nostalgic nod to village life, our Traditional Pump Set is a charming, working installation that delights children and sparks fond memories in elders.',
    expect: ['Working hand pump', 'Heritage charm', 'Great for photos', 'Shaded surroundings'],
    bestFor: ['Photoshoot', 'Get-together'],
    timings: '06:00 AM – 07:00 PM',
    safetyNote: 'Use gently to avoid splashing.',
  },
  {
    slug: 'theatre-house',
    title: 'Theatre House',
    icon: 'theatre',
    category: 'Play & Activities',
    tag: 'Entertainment',
    blurb: 'A cosy screening house for films and presentations.',
    heroImage: images.theatre,
    gallery: [images.theatre, images.cabinInterior],
    description:
      'The Theatre House is an intimate screening space ideal for movie nights, slideshows and presentations, with comfortable seating and crisp projection.',
    expect: ['HD projection', 'Surround sound', 'Comfortable seating', 'Climate controlled'],
    bestFor: ['Movie night', 'Corporate', 'Birthday'],
    timings: '10:00 AM – 11:00 PM',
    safetyNote: 'Please keep aisles clear at all times.',
  },
  {
    slug: 'tower-house',
    title: 'Tower House',
    icon: 'tower',
    category: 'Stays',
    tag: 'Stay',
    blurb: 'An elevated retreat with panoramic garden views.',
    heroImage: images.towerSuite,
    gallery: [images.towerSuite, images.veranda],
    description:
      'Rising above the canopy, the Tower House offers panoramic views of the gardens and a serene perch from which to take in the resort.',
    expect: ['Panoramic views', 'Private balcony', 'Air conditioning', 'Premium linens'],
    bestFor: ['Honeymoon', 'Anniversary'],
    timings: 'Check-in 02:00 PM',
    safetyNote: 'Mind the steps on the upper deck.',
  },
  {
    slug: 'wood-house',
    title: 'Wood House',
    icon: 'cabin',
    category: 'Stays',
    tag: 'Stay',
    blurb: 'A timber cabin wrapped in tranquil greenery.',
    heroImage: images.woodHouse,
    gallery: [images.woodHouse, images.cabinInterior],
    description:
      'A timber sanctuary designed for blissful seclusion, the Wood House pairs natural finishes with quiet, restorative comfort.',
    expect: ['Timber interiors', 'Expansive veranda', 'Air conditioning', 'Forest views'],
    bestFor: ['Couples', 'Weekend retreat'],
    timings: 'Check-in 02:00 PM',
    safetyNote: 'Open flames are not permitted indoors.',
  },
  {
    slug: 'jividha',
    title: 'Jividha',
    icon: 'leaf',
    category: 'Wellness',
    tag: 'Wellness',
    blurb: 'A wellness corner for yoga and quiet reflection.',
    heroImage: images.garden,
    gallery: [images.garden, images.verticalGarden],
    description:
      'Jividha is our dedicated wellness corner — a calm, open space for yoga, meditation and quiet reflection amid the greenery.',
    expect: ['Yoga deck', 'Morning sessions', 'Mats provided', 'Tranquil setting'],
    bestFor: ['Wellness', 'Retreat'],
    timings: '05:30 AM – 08:00 AM',
    safetyNote: 'Please maintain silence in the wellness zone.',
  },
  {
    slug: 'kudil',
    title: 'Kudil',
    icon: 'hut',
    category: 'Stays',
    tag: 'Heritage',
    blurb: 'A traditional thatched hut, reimagined.',
    heroImage: images.kudilCottage,
    gallery: [images.kudilCottage, images.cabinInterior],
    description:
      'The Kudil reinterprets the traditional Tamil hut with thatched silhouettes and earthen tones, wrapped around contemporary comfort.',
    expect: ['Thatched design', 'Earthen tones', 'Veranda seating', 'Grove setting'],
    bestFor: ['Couples', 'Heritage stay'],
    timings: 'Check-in 02:00 PM',
    safetyNote: 'Keep the thatch clear of open flame.',
  },
  {
    slug: 'chillax-bay',
    title: 'Chillax Bay',
    icon: 'hammock',
    category: 'Play & Activities',
    tag: 'Lounge',
    blurb: 'Hammocks and loungers for easy afternoons.',
    heroImage: images.veranda,
    gallery: [images.veranda, images.garden],
    description:
      'Chillax Bay is the resort’s laid-back lounge — hammocks, loungers and shade for unhurried afternoons with a book or a beverage.',
    expect: ['Hammocks & loungers', 'Shaded seating', 'Beverage service', 'Garden views'],
    bestFor: ['Get-together', 'Relaxation'],
    timings: '08:00 AM – 09:00 PM',
    safetyNote: 'One guest per hammock, please.',
  },
  {
    slug: 'garden',
    title: 'Garden',
    icon: 'flower',
    category: 'Nature',
    tag: 'Nature',
    blurb: 'Acres of manicured lawns and botanical beauty.',
    heroImage: images.lushGarden,
    gallery: [images.lushGarden, images.gardenPath],
    description:
      'At the heart of it all, the Garden is acres of manicured lawn, flowering borders and shaded walks — the living canvas for every celebration.',
    expect: ['Manicured lawns', 'Flowering borders', 'Shaded walks', 'Event-ready spaces'],
    bestFor: ['Wedding', 'Get-together', 'Photoshoot'],
    timings: '06:00 AM – 09:00 PM',
    safetyNote: 'Please keep off the freshly seeded areas.',
  },
  {
    slug: 'coconut-farm',
    title: 'Coconut Farm',
    icon: 'palm',
    category: 'Nature',
    tag: 'Nature',
    blurb: 'A working coconut grove you can wander.',
    heroImage: images.coconutFarm,
    gallery: [images.coconutFarm, images.garden],
    description:
      'Wander the swaying Coconut Farm, a working grove that lends the resort its rooted, rural character and the freshest tender coconut water.',
    expect: ['Guided grove walk', 'Fresh tender coconut', 'Shade & breeze', 'Rural charm'],
    bestFor: ['Walks', 'Photoshoot'],
    timings: '06:30 AM – 06:00 PM',
    safetyNote: 'Mind falling coconuts in marked zones.',
  },
  {
    slug: 'shuttle-court',
    title: 'Shuttle Court',
    icon: 'racket',
    category: 'Play & Activities',
    tag: 'Sport',
    blurb: 'A floodlit court for friendly badminton.',
    heroImage: images.shuttleCourt,
    gallery: [images.shuttleCourt, images.garden],
    description:
      'Keep the energy up on our floodlit Shuttle Court, ideal for a friendly game of badminton at any hour.',
    expect: ['Floodlit court', 'Equipment on request', 'All-weather surface', 'Evening play'],
    bestFor: ['Get-together', 'Sport'],
    timings: '06:00 AM – 10:00 PM',
    safetyNote: 'Non-marking shoes required on court.',
  },
  {
    slug: 'camp-fire-with-dj',
    title: 'Camp Fire with DJ',
    icon: 'fire',
    category: 'Play & Activities',
    tag: 'Entertainment',
    blurb: 'Bonfire nights with music under the stars.',
    heroImage: images.campfireDj,
    gallery: [images.campfireDj, images.campfire],
    description:
      'End the day around a crackling Camp Fire with DJ — warm flames, great music and the open sky make for unforgettable evenings under the stars.',
    expect: ['Bonfire setup', 'Live DJ', 'Seating around fire', 'Late-night music'],
    bestFor: ['Birthday', 'Get-together', 'Wedding'],
    timings: '07:00 PM – 12:00 AM',
    safetyNote: 'Maintain a safe distance from the fire pit.',
  },
];

export const amenityCategories: ('All' | AmenityCategory)[] = [
  'All',
  'Wellness',
  'Play & Activities',
  'Stays',
  'Nature',
];

export const getAmenity = (slug: string) =>
  amenities.find((a) => a.slug === slug);
