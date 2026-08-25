export interface ApiAmenity {
  label: string;
  icon: string;
}

export interface ApiStay {
  id: string;
  slug: string;
  name: string;
  badge?: string | null;
  pricePerNight: number;
  rating: number;
  shortIntro: string;
  description: string[];
  heroImage: string;
  gallery: string[];
  amenities: ApiAmenity[];
  capacity: number;
  beds: string;
  inventory: number;
  featured: boolean;
  published: boolean;
}

export interface ApiContent {
  id: string;
  type: 'AMENITY' | 'DINING' | 'EVENT' | 'OFFER';
  slug: string;
  title: string;
  category?: string | null;
  icon?: string | null;
  excerpt: string;
  body: string[];
  heroImage: string;
  gallery: string[];
  tags: string[];
  priceLabel?: string | null;
  meta: Record<string, unknown>;
  featured: boolean;
  sortOrder: number;
}

export interface ApiMenuItem {
  id: string;
  name: string;
  price: number;
  veg?: boolean | null;
}

export interface ApiMenuCategory {
  id: string;
  name: string;
  note?: string | null;
  items: ApiMenuItem[];
}

export interface ApiAddon {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  complimentary: boolean;
  category?: string | null;
}

export interface ApiBanner {
  id: string;
  type: 'ANNOUNCEMENT' | 'HERO' | 'PROMO';
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  endDate?: string | null;
  sortOrder: number;
}

export interface ApiReview {
  id: string;
  author: string;
  rating: number;
  title?: string | null;
  body: string;
  reply?: string | null;
  createdAt: string;
}

export interface NightQuote {
  date: string;
  price: number;
  ruleName: string | null;
}

export interface AvailabilityResult {
  stay: ApiStay;
  nights: number;
  perNight: NightQuote[];
  subtotal: number;
  available: boolean;
  unavailableReason: string | null;
  minStay: number;
  unitsLeft: number;
}

export interface CouponResult {
  code: string;
  description?: string | null;
  discount: number;
  total: number;
}
