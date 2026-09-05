import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Updating Theater House images...");
  
  await prisma.stay.update({
    where: { slug: 'theater-house' },
    data: {
      heroImage: '/images/stays/theatre-house/7L3A9292.webp',
      gallery: JSON.stringify([
        '/images/stays/theatre-house/7L3A9294.webp',
        '/images/stays/theatre-house/7L3A9296.webp',
        '/images/stays/theatre-house/7L3A9299.webp',
        '/images/stays/theatre-house/7L3A9301.webp',
        '/images/stays/theatre-house/7L3A9302.webp',
        '/images/stays/theatre-house/7L3A9314.webp'
      ])
    }
  });

  console.log("Theater House updated successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
