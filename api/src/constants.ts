export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  MANAGER: 'MANAGER',
  FRONT_DESK: 'FRONT_DESK',
  CUSTOMER: 'CUSTOMER',
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Roles permitted to access the admin portal at all. */
export const ADMIN_ROLES: Role[] = [
  ROLES.SUPER_ADMIN,
  ROLES.MANAGER,
  ROLES.FRONT_DESK,
];

export const BOOKING_STATUS = [
  'PENDING',
  'RESERVED',
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
] as const;
export type BookingStatus = (typeof BOOKING_STATUS)[number];

export const PAYMENT_STATUS = ['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const ENQUIRY_STATUS = ['NEW', 'CONTACTED', 'CLOSED'] as const;

export const RATE_KINDS = ['FIXED', 'PERCENT', 'DELTA'] as const;
export type RateKind = (typeof RATE_KINDS)[number];

export const CONTENT_TYPES = ['AMENITY', 'DINING', 'EVENT', 'OFFER'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const COUPON_KINDS = ['PERCENT', 'FLAT'] as const;
export type CouponKind = (typeof COUPON_KINDS)[number];

export const BANNER_TYPES = ['ANNOUNCEMENT', 'HERO', 'PROMO'] as const;
export type BannerType = (typeof BANNER_TYPES)[number];

export const REVIEW_STATUS = ['PENDING', 'APPROVED', 'REJECTED'] as const;

export const PAYMENT_PROVIDERS = ['mock', 'razorpay'] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_TXN_STATUS = ['CREATED', 'PAID', 'FAILED', 'REFUNDED'] as const;

/**
 * Allowed booking status transitions (a simple state machine). Each key lists
 * the statuses it may move to.
 */
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['RESERVED', 'CONFIRMED', 'CANCELLED'],
  RESERVED: ['CONFIRMED', 'CHECKED_IN', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED'],
  CHECKED_IN: ['CHECKED_OUT'],
  CHECKED_OUT: [],
  CANCELLED: [],
};
