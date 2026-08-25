import type { TypeConfig } from './ContentForm';

export type ManagerConfig = TypeConfig & { title: string; subtitle: string };

export const AMENITY_CONFIG: ManagerConfig = {
  type: 'AMENITY',
  singular: 'amenity',
  title: 'Amenities',
  subtitle: 'Attractions and facilities across the garden.',
  hasIcon: true,
};

export const DINING_CONFIG: ManagerConfig = {
  type: 'DINING',
  singular: 'dish',
  title: 'Dining',
  subtitle: 'Cuisines and menus served on premise.',
  hasPrice: true,
};

export const EVENT_CONFIG: ManagerConfig = {
  type: 'EVENT',
  singular: 'event type',
  title: 'Events',
  subtitle: 'Celebration and event formats you host.',
};

export const OFFER_CONFIG: ManagerConfig = {
  type: 'OFFER',
  singular: 'offer',
  title: 'Offers & Packages',
  subtitle: 'Promotional packages shown on the offers page.',
  hasPrice: true,
};
