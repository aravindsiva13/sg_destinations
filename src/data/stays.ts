import { images } from './images';

export interface Amenity {
  label: string;
  icon: string; // icon key used by the Icon component
}

export interface Stay {
  slug: string;
  name: string;
  badge?: string;
  pricePerNight: number;
  rating: number;
  shortIntro: string;
  description: string[];
  heroImage: string;
  gallery: string[];
  extraPhotos: number;
  amenities: Amenity[];
  capacity: number;
  beds: string;
}

export const stays: Stay[] = [
  {
    slug: 'wood-house',
    name: 'Wood House',
    badge: "Couple's Favourite",
    pricePerNight: 24500,
    rating: 4.9,
    shortIntro: 'A timber sanctuary wrapped in greenery.',
    description: [
      'Experience the calm charm of the Wood House, a meticulously crafted cabin designed for blissful seclusion, with its natural surroundings while offering uncompromising luxury. Every detail, from the soft timber finishes to the expansive veranda, has been considered to create a quiet, restorative sanctuary.',
      'Ideal for couples or small families, this peaceful retreat is an absolute minimalist aesthetic, infusing locally textures and industrial sophistication to provide an unforgettable night-resort atmosphere.',
    ],
    heroImage: images.woodHouse,
    gallery: [images.bedroom, images.bathroom, images.veranda, images.cabinInterior],
    extraPhotos: 14,
    capacity: 2,
    beds: '1 Double Bed',
    amenities: [
      { label: 'Air Conditioning', icon: 'snow' },
      { label: 'Double Bed', icon: 'bed' },
      { label: 'Attached Bath', icon: 'bath' },
      { label: 'Veranda', icon: 'veranda' },
      { label: 'Wi-Fi', icon: 'wifi' },
      { label: 'Breakfast', icon: 'dining' },
    ],
  },
  {
    slug: 'tower-house-suite',
    name: 'Tower House Suite',
    badge: 'Panoramic View',
    pricePerNight: 35500,
    rating: 4.8,
    shortIntro: 'Elevated living with garden-wide views.',
    description: [
      'Rise above the canopy in the Tower House Suite, where floor-to-ceiling windows frame the gardens in every direction. The suite pairs an airy, light-filled lounge with a sumptuous bedroom retreat.',
      'A favourite for honeymooners and special occasions, the suite offers a private balcony perfect for sunrise coffee and starlit evenings.',
    ],
    heroImage: images.towerSuite,
    gallery: [images.bedroom, images.cabinInterior, images.veranda, images.bathroom],
    extraPhotos: 11,
    capacity: 3,
    beds: '1 King Bed + Sofa',
    amenities: [
      { label: 'Air Conditioning', icon: 'snow' },
      { label: 'King Bed', icon: 'bed' },
      { label: 'Attached Bath', icon: 'bath' },
      { label: 'Private Balcony', icon: 'veranda' },
      { label: 'Wi-Fi', icon: 'wifi' },
      { label: 'Mini Bar', icon: 'dining' },
    ],
  },
  {
    slug: 'kudil-cottage',
    name: 'Kudil Cottage',
    badge: 'Traditional',
    pricePerNight: 18500,
    rating: 4.7,
    shortIntro: 'A modern ode to the Tamil kudil.',
    description: [
      'The Kudil Cottage reimagines the traditional Tamil dwelling for the modern traveller — thatched silhouettes, earthen tones and handcrafted detail, all wrapped around contemporary comfort.',
      'Set among the coconut groves, it is the most rooted of our stays: simple, soulful and serene.',
    ],
    heroImage: images.kudilCottage,
    gallery: [images.cabinInterior, images.bedroom, images.veranda, images.garden],
    extraPhotos: 9,
    capacity: 2,
    beds: '1 Queen Bed',
    amenities: [
      { label: 'Ceiling Fan', icon: 'snow' },
      { label: 'Queen Bed', icon: 'bed' },
      { label: 'Attached Bath', icon: 'bath' },
      { label: 'Veranda', icon: 'veranda' },
      { label: 'Wi-Fi', icon: 'wifi' },
      { label: 'Filter Coffee', icon: 'dining' },
    ],
  },
];

export const getStay = (slug: string) => stays.find((s) => s.slug === slug);
