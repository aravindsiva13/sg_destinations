import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** A small starter set of booking add-ons (mix of complimentary + priced). */
const ADDONS = [
  { name: 'Welcome drink on arrival', description: 'Fresh seasonal cooler for every guest.', price: 0, complimentary: true, category: 'Hospitality', sortOrder: 0 },
  { name: 'Complimentary breakfast', description: 'South-Indian breakfast spread each morning.', price: 0, complimentary: true, category: 'Dining', sortOrder: 1 },
  { name: 'Airport / station pickup', description: 'Private cab, one way.', price: 1500, complimentary: false, category: 'Travel', sortOrder: 2 },
  { name: 'Candlelight dinner for two', description: 'Private garden setup with a curated menu.', price: 3000, complimentary: false, category: 'Dining', sortOrder: 3 },
  { name: 'Room decoration', description: 'Flowers & lights for celebrations.', price: 5000, complimentary: false, category: 'Celebrations', sortOrder: 4 },
  { name: 'Photography (2 hours)', description: 'A photographer for your event.', price: 6000, complimentary: false, category: 'Celebrations', sortOrder: 5 },
];

async function main() {
  let created = 0;
  for (const a of ADDONS) {
    const exists = await prisma.addon.findFirst({ where: { name: a.name } });
    if (exists) continue;
    await prisma.addon.create({ data: a });
    created++;
  }
  console.log(`Seeded ${created} add-ons (${ADDONS.length - created} already present).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
