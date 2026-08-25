import { images } from './images';

export interface DiningItem {
  name: string;
  tag: string;
  price: number;
  description: string;
  image: string;
}

export const diningCards: DiningItem[] = [
  {
    name: 'The Garden Grill',
    tag: 'Signature',
    price: 850,
    description: 'Flame-grilled platters served beneath the open sky.',
    image: images.diningBurger,
  },
  {
    name: 'Saapadu Thali',
    tag: 'Traditional',
    price: 650,
    description: 'A banana-leaf feast of authentic Tamil home cooking.',
    image: images.diningPlate,
  },
  {
    name: "Chef's Spread",
    tag: 'Buffet',
    price: 1200,
    description: 'A lavish multi-cuisine buffet for celebrations of any size.',
    image: images.diningSpread,
  },
];

export interface Cuisine {
  name: string;
  blurb: string;
  image: string;
}

export const cuisines: Cuisine[] = [
  {
    name: 'Authentic Tamil',
    blurb:
      'Rooted recipes cooked over slow flame — from fragrant biryanis to banana-leaf thalis.',
    image: images.southIndian,
  },
  {
    name: 'Live Grill & BBQ',
    blurb:
      'Chefs working open grills under the stars, plating smoky, flame-kissed favourites.',
    image: images.diningBurger,
  },
  {
    name: 'Continental & More',
    blurb:
      'A worldly spread for every palate, from fresh salads to comforting classics.',
    image: images.diningTable,
  },
];

export interface DiningTiming {
  meal: string;
  hours: string;
}

export const diningTimings: DiningTiming[] = [
  { meal: 'Breakfast', hours: '07:30 AM – 10:00 AM' },
  { meal: 'Lunch', hours: '12:30 PM – 03:00 PM' },
  { meal: 'Hi-Tea', hours: '04:30 PM – 06:00 PM' },
  { meal: 'Dinner', hours: '07:30 PM – 10:30 PM' },
];
