import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Checking stays images...");
  
  const staysToSeed = [
    {
      slug: 'madhan-residency-villa',
      heroImage: '/images/stays/madhan-residency-villa/7L3A9204.webp',
      gallery: [
        "/images/stays/madhan-residency-villa/7L3A9204.webp",
        "/images/stays/madhan-residency-villa/7L3A9205.webp",
        "/images/stays/madhan-residency-villa/7L3A9206.webp",
        "/images/stays/madhan-residency-villa/7L3A9207.webp",
        "/images/stays/madhan-residency-villa/7L3A9208.webp",
        "/images/stays/madhan-residency-villa/7L3A9209.webp",
        "/images/stays/madhan-residency-villa/7L3A9210.webp",
        "/images/stays/madhan-residency-villa/7L3A9211.webp",
        "/images/stays/madhan-residency-villa/7L3A9212.webp",
        "/images/stays/madhan-residency-villa/7L3A9213.webp",
        "/images/stays/madhan-residency-villa/7L3A9214.webp",
        "/images/stays/madhan-residency-villa/7L3A9215.webp",
        "/images/stays/madhan-residency-villa/7L3A9216.webp",
        "/images/stays/madhan-residency-villa/7L3A9217.webp",
        "/images/stays/madhan-residency-villa/7L3A9218.webp",
        "/images/stays/madhan-residency-villa/7L3A9219.webp",
        "/images/stays/madhan-residency-villa/7L3A9220.webp",
        "/images/stays/madhan-residency-villa/7L3A9221.webp",
        "/images/stays/madhan-residency-villa/7L3A9222.webp",
        "/images/stays/madhan-residency-villa/7L3A9226.webp",
        "/images/stays/madhan-residency-villa/7L3A9227.webp",
        "/images/stays/madhan-residency-villa/7L3A9228.webp",
        "/images/stays/madhan-residency-villa/7L3A9229.webp",
        "/images/stays/madhan-residency-villa/7L3A9230.webp",
        "/images/stays/madhan-residency-villa/7L3A9232.webp",
        "/images/stays/madhan-residency-villa/7L3A9233.webp",
        "/images/stays/madhan-residency-villa/7L3A9240.webp",
        "/images/stays/madhan-residency-villa/7L3A9248.webp",
        "/images/stays/madhan-residency-villa/7L3A9384.webp"
      ]
    },
    {
      slug: 'tower-house',
      heroImage: '/images/stays/tower-house/7L3A9399.webp',
      gallery: [
        "/images/stays/tower-house/7L3A9399.webp",
        "/images/stays/tower-house/7L3A9400.webp",
        "/images/stays/tower-house/7L3A9403.webp",
        "/images/stays/tower-house/7L3A9404.webp",
        "/images/stays/tower-house/7L3A9405.webp",
        "/images/stays/tower-house/7L3A9407.webp",
        "/images/stays/tower-house/7L3A9409.webp",
        "/images/stays/tower-house/7L3A9410.webp",
        "/images/stays/tower-house/7L3A9453.webp"
      ]
    },
    {
      slug: 'wood-house-1',
      heroImage: '/images/stays/wood-house-1/7L3A9320.webp',
      gallery: [
        "/images/stays/wood-house-1/7L3A9320.webp",
        "/images/stays/wood-house-1/7L3A9324.webp",
        "/images/stays/wood-house-1/7L3A9341.webp",
        "/images/stays/wood-house-1/7L3A9342.webp",
        "/images/stays/wood-house-1/7L3A9343.webp"
      ]
    }
  ];

  for (const s of staysToSeed) {
    const existing = await prisma.stay.findUnique({ where: { slug: s.slug } });
    if (!existing) continue;
    // Only update if heroImage is empty or default logo placeholder
    const isPlaceholder = !existing.heroImage || existing.heroImage.includes('logo-dark');
    if (isPlaceholder) {
      await prisma.stay.update({
        where: { slug: s.slug },
        data: {
          heroImage: s.heroImage,
          gallery: JSON.stringify(s.gallery)
        }
      });
      console.log(`Updated images for ${s.slug}`);
    } else {
      console.log(`Preserved custom images for ${s.slug}: ${existing.heroImage}`);
    }
  }

  console.log("Stays check completed!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
