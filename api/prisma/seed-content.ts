import { PrismaClient } from '@prisma/client';
import { seedContent } from './content-data.js';

const prisma = new PrismaClient();

seedContent(prisma)
  .then((r) =>
    console.log(
      `Seeded ${r.content} content items, ${r.coupons} coupons, ${r.banners} banners, ${r.reviews} reviews.`,
    ),
  )
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
