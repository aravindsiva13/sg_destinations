import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialCategories = [
  {
    slug: 'italian-family',
    name: 'A Taste of Italy',
    description: 'Special moments and authentic experiences with our Italian family.',
    sortOrder: 0,
    images: Array.from({ length: 17 }, (_, i) => `/images/selected-images/Family/italian-family-${i + 1}.jpeg`),
  },
  {
    slug: 'events',
    name: 'Events & Celebrations',
    description: 'Unforgettable moments celebrated in our versatile venues.',
    sortOrder: 1,
    images: [
      '/images/selected-images/Events/7L3A1899.JPG',
      '/images/selected-images/Events/7L3A1901.JPG',
      '/images/selected-images/Events/7L3A1933.JPG',
      '/images/selected-images/Events/7L3A2041.JPG',
      '/images/selected-images/Events/7L3A2124.JPG',
      '/images/selected-images/Events/7L3A2139.JPG',
    ],
  },
  {
    slug: 'family',
    name: 'Family Moments',
    description: 'Cherished memories created by our guests at Shraddha Garden.',
    sortOrder: 2,
    images: [
      '/images/selected-images/Family/7L3A1948.JPG',
      '/images/selected-images/Family/7L3A2000.JPG',
      '/images/selected-images/Family/7L3A2099.JPG',
      '/images/selected-images/Family/7L3A2102.JPG',
      '/images/selected-images/Family/7L3A2105.JPG',
      '/images/selected-images/Family/7L3A2265.JPG',
      '/images/selected-images/Family/7L3A2279.JPG',
      '/images/selected-images/Family/7L3A2306.JPG',
    ],
  },
  {
    slug: 'resort',
    name: 'Resort & Activities',
    description: 'Relaxation and fun across our lush property.',
    sortOrder: 3,
    images: [
      '/images/selected-images/Resort/7L3A1963.JPG',
      '/images/selected-images/Resort/7L3A2204.JPG',
      '/images/selected-images/Resort/7L3A2214.JPG',
    ],
  },
  {
    slug: 'interior',
    name: 'Interiors & Comfort',
    description: 'Elegant spaces designed for your utmost relaxation.',
    sortOrder: 4,
    images: [
      '/images/selected-images/Interior/7L3A2112.JPG',
      '/images/selected-images/Interior/7L3A2314.JPG',
      '/images/selected-images/Interior/7L3A2317.JPG',
    ],
  },
];

export async function seedGallery() {
  console.log('Seeding gallery categories and images...');

  for (const cat of initialCategories) {
    const existing = await prisma.galleryCategory.findUnique({
      where: { slug: cat.slug },
      include: { images: true },
    });

    if (!existing) {
      const created = await prisma.galleryCategory.create({
        data: {
          slug: cat.slug,
          name: cat.name,
          description: cat.description,
          sortOrder: cat.sortOrder,
          published: true,
          images: {
            create: cat.images.map((url, idx) => ({
              url,
              sortOrder: idx,
              alt: `${cat.name} photo ${idx + 1}`,
            })),
          },
        },
      });
      console.log(`Created category "${created.name}" with ${cat.images.length} images.`);
    } else {
      console.log(`Category "${cat.name}" already exists (${existing.images.length} images). Skipping.`);
    }
  }

  console.log('Gallery seed complete.');
}

if (process.argv[1]?.endsWith('seed-gallery.ts') || process.argv[1]?.endsWith('seed-gallery.js')) {
  seedGallery()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
