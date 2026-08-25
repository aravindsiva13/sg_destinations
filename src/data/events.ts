import { images } from './images';

export interface EventType {
  name: string;
  blurb: string;
  image: string;
}

export const eventTypes: EventType[] = [
  {
    name: 'Weddings',
    blurb:
      'Say your vows amidst lush lawns and golden light — a setting made for forever.',
    image: images.wedding,
  },
  {
    name: 'Birthdays',
    blurb:
      'From first birthdays to milestone celebrations, every detail handled with joy.',
    image: images.birthday,
  },
  {
    name: 'Corporate',
    blurb:
      'Offsites, conferences and team retreats with nature as your boardroom backdrop.',
    image: images.corporate,
  },
  {
    name: 'Get-togethers',
    blurb:
      'Reunions, anniversaries and family gatherings under the open garden sky.',
    image: images.getTogether,
  },
];

export const eventGallery: string[] = [
  images.celebration,
  images.eventTable,
  images.wedding,
  images.birthday,
  images.getTogether,
  images.corporate,
];
