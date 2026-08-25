import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { env } from '../src/env.js';
import { generateBookingCode } from '../src/serialize.js';
import { seedContent } from './content-data.js';

const prisma = new PrismaClient();

const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const img = {
  woodHouse: u('1518780664697-55e3ad937233'),
  towerSuite: u('1582719478250-c89cae4dc85b'),
  kudilCottage: u('1520250497591-112f2f40a3f4'),
  cabinInterior: u('1611892440504-42a792e24d32'),
  bedroom: u('1505693416388-ac5ce068fe85'),
  bathroom: u('1620626011761-996317b8d101'),
  veranda: u('1600585154340-be6161a56a0c'),
  garden: u('1558616629-899031969d5e'),
};

async function main() {
  console.log('Seeding Shraddha Garden database…');

  // ---- Clear (idempotent reseed) ----
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.stay.deleteMany();
  await prisma.user.deleteMany();

  // ---- Users ----
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // Never seed with a fallback default password. In production the operator
  // must set SEED_ADMIN_PASSWORD explicitly (see api/.env.example).
  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!seedAdminPassword || seedAdminPassword.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD is required (min 12 chars) to seed the admin account');
  }

  const superAdmin = await prisma.user.create({
    data: {
      email: env.seedAdminEmail,
      passwordHash: hash(seedAdminPassword),
      name: env.seedAdminName,
      role: 'SUPER_ADMIN',
    },
  });

  // Demo staff + customer accounts are for development only. In production the
  // admin creates real staff accounts via the Users page — never seed
  // well-known passwords.
  let customerId: string | null = null;


  // ---- Stays ----
  const stays = await Promise.all([
    prisma.stay.create({
      data: {
        slug: 'wood-house',
        name: 'Wood House',
        badge: "Couple's Favourite",
        pricePerNight: 24500,
        rating: 4.9,
        shortIntro: 'A timber sanctuary wrapped in greenery.',
        description: JSON.stringify([
          'Experience the calm charm of the Wood House, a meticulously crafted cabin designed for blissful seclusion while offering uncompromising luxury.',
          'Ideal for couples or small families, this peaceful retreat blends minimalist aesthetics with locally rooted textures.',
        ]),
        heroImage: img.woodHouse,
        gallery: JSON.stringify([img.bedroom, img.bathroom, img.veranda, img.cabinInterior]),
        amenities: JSON.stringify([
          { label: 'Air Conditioning', icon: 'snow' },
          { label: 'Double Bed', icon: 'bed' },
          { label: 'Attached Bath', icon: 'bath' },
          { label: 'Veranda', icon: 'veranda' },
          { label: 'Wi-Fi', icon: 'wifi' },
          { label: 'Breakfast', icon: 'dining' },
        ]),
        capacity: 2,
        beds: '1 Double Bed',
        inventory: 3,
        featured: true,
      },
    }),
    prisma.stay.create({
      data: {
        slug: 'tower-house-suite',
        name: 'Tower House Suite',
        badge: 'Panoramic View',
        pricePerNight: 35500,
        rating: 4.8,
        shortIntro: 'Elevated living with garden-wide views.',
        description: JSON.stringify([
          'Rise above the canopy in the Tower House Suite, where floor-to-ceiling windows frame the gardens in every direction.',
          'A favourite for honeymooners, the suite offers a private balcony perfect for sunrise coffee and starlit evenings.',
        ]),
        heroImage: img.towerSuite,
        gallery: JSON.stringify([img.bedroom, img.cabinInterior, img.veranda, img.bathroom]),
        amenities: JSON.stringify([
          { label: 'Air Conditioning', icon: 'snow' },
          { label: 'King Bed', icon: 'bed' },
          { label: 'Attached Bath', icon: 'bath' },
          { label: 'Private Balcony', icon: 'veranda' },
          { label: 'Wi-Fi', icon: 'wifi' },
          { label: 'Mini Bar', icon: 'dining' },
        ]),
        capacity: 3,
        beds: '1 King Bed + Sofa',
        inventory: 2,
        featured: true,
      },
    }),
    prisma.stay.create({
      data: {
        slug: 'kudil-cottage',
        name: 'Kudil Cottage',
        badge: 'Traditional',
        pricePerNight: 18500,
        rating: 4.7,
        shortIntro: 'A modern ode to the Tamil kudil.',
        description: JSON.stringify([
          'The Kudil Cottage reimagines the traditional Tamil dwelling for the modern traveller — thatched silhouettes, earthen tones and handcrafted detail.',
          'Set among the coconut groves, it is the most rooted of our stays: simple, soulful and serene.',
        ]),
        heroImage: img.kudilCottage,
        gallery: JSON.stringify([img.cabinInterior, img.bedroom, img.veranda, img.garden]),
        amenities: JSON.stringify([
          { label: 'Ceiling Fan', icon: 'snow' },
          { label: 'Queen Bed', icon: 'bed' },
          { label: 'Attached Bath', icon: 'bath' },
          { label: 'Veranda', icon: 'veranda' },
          { label: 'Wi-Fi', icon: 'wifi' },
          { label: 'Filter Coffee', icon: 'dining' },
        ]),
        capacity: 2,
        beds: '1 Queen Bed',
        inventory: 4,
      },
    }),
  ]);

  // ---- Bookings (varied statuses, some paid for revenue charts) ----
  const day = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(14, 0, 0, 0);
    return d;
  };

  const bookingSpecs = [
    { stay: 0, name: 'Anaya Rao', email: 'guest@example.com', inDay: 0, nights: 2, status: 'CHECKED_IN', pay: 'PAID', userId: customerId ?? null },
    { stay: 1, name: 'Rohan Mehta', email: 'rohan@example.com', inDay: 0, nights: 3, status: 'CONFIRMED', pay: 'PAID' },
    { stay: 2, name: 'Priya Nair', email: 'priya@example.com', inDay: 2, nights: 1, status: 'CONFIRMED', pay: 'UNPAID' },
    { stay: 0, name: 'Kabir Singh', email: 'kabir@example.com', inDay: -3, nights: 2, status: 'CHECKED_OUT', pay: 'PAID' },
    { stay: 1, name: 'Diya Patel', email: 'diya@example.com', inDay: 5, nights: 2, status: 'PENDING', pay: 'UNPAID' },
    { stay: 2, name: 'Arjun Das', email: 'arjun@example.com', inDay: -10, nights: 4, status: 'CHECKED_OUT', pay: 'PAID' },
    { stay: 0, name: 'Meera Iyer', email: 'meera@example.com', inDay: 7, nights: 1, status: 'CANCELLED', pay: 'REFUNDED' },
  ] as const;

  for (const spec of bookingSpecs) {
    const stay = stays[spec.stay];
    const checkIn = day(spec.inDay);
    const checkOut = day(spec.inDay + spec.nights);
    await prisma.booking.create({
      data: {
        code: generateBookingCode(),
        stayId: stay.id,
        userId: 'userId' in spec ? spec.userId : null,
        customerName: spec.name,
        customerEmail: spec.email,
        customerPhone: '+91 90000 00000',
        checkIn,
        checkOut,
        nights: spec.nights,
        guests: 2,
        amount: spec.nights * stay.pricePerNight,
        status: spec.status,
        paymentStatus: spec.pay,
        source: 'Website',
      },
    });
  }

  // ---- Enquiries ----
  await prisma.enquiry.createMany({
    data: [
      { name: 'Lakshmi & Vikram', email: 'lakshmi@example.com', phone: '+91 90000 22222', occasion: 'Wedding', guests: 250, message: 'Looking for a December wedding date.', status: 'NEW' },
      { name: 'TechNova Pvt Ltd', email: 'events@technova.com', occasion: 'Corporate', guests: 80, message: 'Two-day offsite with stays.', status: 'CONTACTED', assignee: 'Demo Manager' },
      { name: 'Sunil Kumar', email: 'sunil@example.com', occasion: 'Birthday', guests: 40, message: '60th birthday get-together.', status: 'NEW' },
    ],
  });

  // ---- Rate rules & date blocks ----
  const inDays = (n: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return d;
  };

  await prisma.rateRule.createMany({
    data: [
      {
        name: 'Festive Season (+25%)',
        stayId: null, // all stays
        startDate: inDays(20),
        endDate: inDays(35),
        kind: 'PERCENT',
        amount: 125,
        minStay: 2,
        priority: 10,
      },
      {
        name: 'Weekday Saver (Wood House)',
        stayId: stays[0].id,
        startDate: inDays(1),
        endDate: inDays(14),
        kind: 'DELTA',
        amount: -2000,
        minStay: 1,
        priority: 5,
      },
    ],
  });

  await prisma.dateBlock.create({
    data: {
      stayId: stays[1].id,
      startDate: inDays(8),
      endDate: inDays(11),
      reason: 'Annual maintenance',
    },
  });

  const contentResult = await seedContent(prisma);
  console.log(`Seeded ${contentResult.content} content items and ${contentResult.coupons} coupons.`);

  console.log('Seed complete.');
  console.log('Super Admin:', superAdmin.email, '(password from SEED_ADMIN_PASSWORD)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
