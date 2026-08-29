import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Deleting old stays and bookings...");
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.rateRule.deleteMany();
  await prisma.dateBlock.deleteMany();
  await prisma.stay.deleteMany();
  await prisma.addon.deleteMany();
  
  console.log("Inserting new stays...");
  
  await prisma.stay.createMany({
    data: [
      {
        slug: 'wood-house-1',
        name: 'Wood House 1',
        badge: 'Classic',
        pricePerNight: 6000,
        rating: 5.0,
        shortIntro: '4 person wood house',
        description: JSON.stringify(['Comfortable 4 person wood house.']),
        heroImage: '/images/brand/logo-dark.png',
        gallery: JSON.stringify([]),
        amenities: JSON.stringify([
          { label: 'Air Conditioning', icon: 'snow' },
          { label: 'Wi-Fi', icon: 'wifi' }
        ]),
        capacity: 4,
        beds: 'Double Beds',
        inventory: 1,
        featured: true,
      },
      {
        slug: 'theater-house',
        name: 'Theater House',
        badge: 'Entertainment',
        pricePerNight: 12000,
        rating: 5.0,
        shortIntro: '4 person theater house',
        description: JSON.stringify(['A unique stay featuring a private theater setup for 4 persons.']),
        heroImage: '/images/brand/logo-dark.png',
        gallery: JSON.stringify([]),
        amenities: JSON.stringify([
          { label: 'Air Conditioning', icon: 'snow' },
          { label: 'Home Theater', icon: 'monitor' },
          { label: 'Wi-Fi', icon: 'wifi' }
        ]),
        capacity: 4,
        beds: 'Double Beds',
        inventory: 1,
        featured: true,
      },
      {
        slug: 'wood-house-2',
        name: 'Wood House 2',
        badge: 'Spacious',
        pricePerNight: 9000,
        rating: 5.0,
        shortIntro: '6 person wood house',
        description: JSON.stringify(['A larger wood house suitable for groups up to 6.']),
        heroImage: '/images/brand/logo-dark.png',
        gallery: JSON.stringify([]),
        amenities: JSON.stringify([
          { label: 'Air Conditioning', icon: 'snow' },
          { label: 'Wi-Fi', icon: 'wifi' }
        ]),
        capacity: 6,
        beds: 'Double Beds',
        inventory: 1,
        featured: false,
      },
      {
        slug: 'tower-house',
        name: 'Tower House',
        badge: 'Panoramic View',
        pricePerNight: 8000,
        rating: 5.0,
        shortIntro: '4 person tower house',
        description: JSON.stringify(['Elevated views and comfortable stay for 4 persons.']),
        heroImage: '/images/brand/logo-dark.png',
        gallery: JSON.stringify([]),
        amenities: JSON.stringify([
          { label: 'Air Conditioning', icon: 'snow' },
          { label: 'Wi-Fi', icon: 'wifi' }
        ]),
        capacity: 4,
        beds: 'Double Beds',
        inventory: 1,
        featured: false,
      },
      {
        slug: 'madhan-residency-villa',
        name: 'Madhan Residency Luxury Villa',
        badge: 'Luxury',
        pricePerNight: 8000,
        rating: 5.0,
        shortIntro: 'Triple bedroom luxurious villa (2600sqft)',
        description: JSON.stringify(['Total take over for 6 persons. Triple bedroom luxurious villa (2600sqft).']),
        heroImage: '/images/brand/logo-dark.png',
        gallery: JSON.stringify([]),
        amenities: JSON.stringify([
          { label: 'Fully Air Conditioned', icon: 'snow' },
          { label: 'Unlimited Wi-Fi', icon: 'wifi' },
          { label: 'UPS Back up', icon: 'battery' }
        ]),
        capacity: 6,
        beds: 'Triple Bedroom',
        inventory: 1,
        featured: true,
      }
    ]
  });

  console.log("Inserting Addons...");
  await prisma.addon.createMany({
    data: [
      {
        name: 'Extra Bed (1 Person)',
        description: 'Additional bed for one person',
        price: 750,
        active: true
      },
      {
        name: 'Fully take over (without accommodation)',
        description: 'Event take over without rooms',
        price: 12000,
        active: true
      },
      {
        name: 'Fully take over (with accommodation)',
        description: 'Full resort take over including rooms',
        price: 250000,
        active: true
      }
    ]
  });

  console.log("Stays and addons updated successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
