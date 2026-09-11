import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../http.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../constants.js';
import { recordAudit } from '../audit.js';

export const settingsRouter = Router();

/** Defaults returned when a key has not been overridden in the DB. */
const DEFAULTS: Record<string, unknown> = {
  resortName: 'Shraddha Garden Resort',
  gstPercent: 12,
  currency: 'INR',
  offerAppliesToPeak: true,
  contactEmail: 'hello@shraddhagarden.com',
  contactPhone: '+91 98941 99762',
  whatsapp: '+91 98941 99762',
  address: 'Shraddha Garden Resort, Tamil Nadu, India',
  checkInTime: '14:00',
  checkOutTime: '11:00',

  // Social & Maps
  instagramUrl: 'https://instagram.com/shraddhagarden',
  facebookUrl: 'https://facebook.com/shraddhagarden',
  youtubeUrl: 'https://youtube.com/@shraddhagarden',
  tripadvisorUrl: '',
  googleMapsUrl: 'https://maps.google.com/?q=Shraddha+Garden+Resort',
  googleMapsEmbed: '',
  footerTagline: 'A sanctuary of celebration and stays, where memories unfold amidst forty acres of lush greenery.',

  // Page Hero Banners
  eventsHeroImage: '/images/selected-images/Events/7L3A1899.JPG',
  diningHeroImage1: '/images/selected-images/new/water_shower.jpeg',
  diningHeroImage2: '/images/selected-images/new/shra_vanam.jpeg',
  amenitiesHeroBanner: '/images/selected-images/new/pool_wide.jpeg',

  // Home Page Highlights
  homeHeadline: 'Celebrate amidst lush\ngreen gardens',
  homeSubtext: 'A sanctuary of celebration and stays, where every milestone unfolds amidst forty acres of botanical beauty and timeless Tamil warmth.',
  homeHeroCards: [
    { src: '/images/selected-images/new/entrance.jpeg', alt: 'Shraddha Garden glowing entrance sign' },
    { src: '/images/selected-images/new/waterfall.jpeg', alt: 'Girl in a pink dress on a garden swing' },
    { src: '/images/selected-images/Family/italian-family-1.jpeg', alt: 'Italian family group portrait' },
  ],
  homeStats: [
    { value: '40+', label: 'Acres of greenery' },
    { value: '16', label: 'Unique amenities' },
    { value: '3', label: 'Signature kitchens' },
    { value: '1k+', label: 'Events celebrated' },
  ],
  homeTraditionTitle: 'Your ultimate getaway, rooted in Tamil tradition',
  homeTraditionSubtext: 'From thatched kudil cottages to a glassy garden pool, every corner of Shraddha Garden is designed to feel both luxurious and deeply rooted in the land it grows from.',
  homeTraditionPoints: [
    'Acres of manicured, lush green gardens',
    'Rooted in authentic Tamil hospitality',
    'Stays, dining and celebration — all on-site',
    'A dedicated host for every occasion',
  ],
  homeTraditionImages: [
    '/images/selected-images/new/lush_garden.jpeg',
    '/images/selected-images/new/garden_path.jpeg',
    '/images/selected-images/new/pool_wide.jpeg',
  ],

  // About Page Story
  aboutHeroTitle: 'A garden built for togetherness',
  aboutHeroSubtext: 'What began as a stretch of coconut grove is today a sanctuary of celebration and stays — a place designed, quite simply, for people to come together.',
  aboutHeroImages: [
    '/images/selected-images/new/pool_wide.jpeg',
    '/images/selected-images/new/shra_vanam.jpeg',
  ],
  aboutIntroBlocks: [
    {
      eyebrow: 'Built upon luxury',
      body: 'Shraddha Garden was conceived as a place where understated luxury meets the living landscape — a retreat that feels generous, grounded and unmistakably ours.',
    },
    {
      eyebrow: 'Peace, greenery, beauty',
      body: 'Forty acres of manicured gardens, flowering borders and quiet water features create a sanctuary that calms the moment you arrive.',
    },
    {
      eyebrow: 'A canvas for legacies',
      body: 'From weddings to milestone birthdays, the garden becomes the backdrop for the memories your family will return to for years.',
    },
  ],
  aboutHosts: [
    {
      icon: 'star',
      title: 'Your celebration host',
      text: 'One dedicated host owns your day from the first call to the final farewell — availability, planning and on-site coordination.',
    },
    {
      icon: 'dining',
      title: 'Chef & live kitchens',
      text: 'Meals are cooked fresh on site. Menus are shaped together around your guests, your occasion and the season.',
    },
    {
      icon: 'check',
      title: 'Grounds & concierge',
      text: 'Housekeeping, valet, security and a garden crew that keeps every corner welcoming, around the clock.',
    },
  ],
  aboutHandledOnSite: [
    'Dedicated celebration host',
    'Housekeeping & valet',
    'Live kitchen & fresh catering setup',
    'Decor & lighting coordination',
    'Sound, audiovisual & power backup',
    'Round-the-clock property security',
    'Garden lawn preparation & seating',
    'Guest check-in & accommodation concierge',
  ],
};

/**
 * Only these keys are exposed on the PUBLIC settings endpoint. Secret configs
 * (e.g. `payments`, `email`) are also stored in SiteSetting but must never be
 * returned to the browser — so the public view is an explicit allow-list.
 */
const PUBLIC_KEYS = Object.keys(DEFAULTS);

async function readAll(): Promise<Record<string, unknown>> {
  const rows = await prisma.siteSetting.findMany();
  const overrides: Record<string, unknown> = {};
  for (const r of rows) {
    try {
      overrides[r.key] = JSON.parse(r.value);
    } catch {
      overrides[r.key] = r.value;
    }
  }
  return { ...DEFAULTS, ...overrides };
}

// Public read — only the allow-listed site config (GST, contact, times).
settingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const all = await readAll();
    const view: Record<string, unknown> = {};
    for (const key of PUBLIC_KEYS) view[key] = all[key];
    res.json(view);
  }),
);

// Admin upsert (partial merge of keys) — STRICTLY allow-listed so secret
// blobs (`payments`, `email`, …) can never be written through this route.
// They have dedicated SUPER_ADMIN-only endpoints instead.
const settingsSchema = z
  .object({
    resortName: z.string().min(1).optional(),
    gstPercent: z.coerce.number().min(0).max(100).optional(),
    currency: z.string().min(1).optional(),
    offerAppliesToPeak: z.boolean().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().min(1).optional(),
    whatsapp: z.string().min(1).optional(),
    address: z.string().min(1).optional(),
    checkInTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    checkOutTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),

    // Social & Maps
    instagramUrl: z.string().optional().nullable(),
    facebookUrl: z.string().optional().nullable(),
    youtubeUrl: z.string().optional().nullable(),
    tripadvisorUrl: z.string().optional().nullable(),
    googleMapsUrl: z.string().optional().nullable(),
    googleMapsEmbed: z.string().optional().nullable(),
    footerTagline: z.string().optional().nullable(),

    // Page Hero Banners
    eventsHeroImage: z.string().optional().nullable(),
    diningHeroImage1: z.string().optional().nullable(),
    diningHeroImage2: z.string().optional().nullable(),
    amenitiesHeroBanner: z.string().optional().nullable(),

    // Home Page Highlights
    homeHeadline: z.string().optional().nullable(),
    homeSubtext: z.string().optional().nullable(),
    homeHeroCards: z.array(z.object({ src: z.string(), alt: z.string() })).optional(),
    homeStats: z.array(z.object({ value: z.string(), label: z.string() })).optional(),
    homeTraditionTitle: z.string().optional().nullable(),
    homeTraditionSubtext: z.string().optional().nullable(),
    homeTraditionPoints: z.array(z.string()).optional(),
    homeTraditionImages: z.array(z.string()).optional(),

    // About Page Story
    aboutHeroTitle: z.string().optional().nullable(),
    aboutHeroSubtext: z.string().optional().nullable(),
    aboutHeroImages: z.array(z.string()).optional(),
    aboutIntroBlocks: z.array(z.object({ eyebrow: z.string(), body: z.string() })).optional(),
    aboutHosts: z.array(z.object({ icon: z.string(), title: z.string(), text: z.string() })).optional(),
    aboutHandledOnSite: z.array(z.string()).optional(),
  })
  .strict();

settingsRouter.put(
  '/',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.MANAGER),
  validateBody(settingsSchema),
  asyncHandler(async (req, res) => {
    const entries = Object.entries(req.body as Record<string, unknown>);
    await Promise.all(
      entries.map(([key, value]) =>
        prisma.siteSetting.upsert({
          where: { key },
          create: { key, value: JSON.stringify(value) },
          update: { value: JSON.stringify(value) },
        }),
      ),
    );
    await recordAudit({ actor: req.user, action: 'update', entity: 'Settings' });
    // Return the same allow-listed view as the public read — never the
    // `payments`/`email` blobs that also live in SiteSetting.
    const all = await readAll();
    const view: Record<string, unknown> = {};
    for (const key of PUBLIC_KEYS) view[key] = all[key];
    res.json(view);
  }),
);
