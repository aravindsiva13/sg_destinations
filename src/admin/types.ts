export type Role = 'SUPER_ADMIN' | 'MANAGER' | 'FRONT_DESK' | 'CUSTOMER';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
}

export type BookingStatus =
  | 'PENDING'
  | 'RESERVED'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';

export interface Booking {
  id: string;
  code: string;
  stayId: string;
  stay?: { name: string; slug: string };
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  amount: number;
  amountPaid?: number;
  balanceDue?: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  source: string;
  notes?: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface Amenity {
  label: string;
  icon: string;
}

export interface Stay {
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
  amenities: Amenity[];
  capacity: number;
  beds: string;
  inventory: number;
  featured: boolean;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RateKind = 'FIXED' | 'PERCENT' | 'DELTA';

export interface RateRule {
  id: string;
  name: string;
  stayId?: string | null;
  stay?: { name: string } | null;
  startDate: string;
  endDate: string;
  kind: RateKind;
  amount: number;
  minStay: number;
  priority: number;
  active: boolean;
  createdAt: string;
}

export interface DateBlock {
  id: string;
  stayId: string;
  stay?: { name: string } | null;
  startDate: string;
  endDate: string;
  reason?: string | null;
  createdAt: string;
}

export interface NightQuote {
  date: string;
  price: number;
  ruleName: string | null;
}

export interface AvailabilityResult {
  stay: Stay;
  nights: number;
  perNight: NightQuote[];
  subtotal: number;
  available: boolean;
  unavailableReason: string | null;
  minStay: number;
  unitsLeft: number;
}

export interface DashboardStats {
  kpis: {
    revenue: number;
    bookingsToday: number;
    checkInsToday: number;
    checkOutsToday: number;
    newEnquiries: number;
    occupancy: number;
    activeStays: number;
  };
  revenueByMonth: { label: string; revenue: number }[];
  bookingsByStatus: { status: BookingStatus; count: number }[];
}

export type ContentType = 'AMENITY' | 'DINING' | 'EVENT' | 'OFFER';

export interface ContentItem {
  id: string;
  type: ContentType;
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
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  veg?: boolean | null;
  available: boolean;
  sortOrder: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  note?: string | null;
  published: boolean;
  sortOrder: number;
  items: MenuItem[];
}

export interface EmailEvents {
  enquiryAck: boolean;
  bookingReceived: boolean;
  bookingConfirmed: boolean;
  bookingCancelled: boolean;
  checkInReminder: boolean;
  reviewRequest: boolean;
  staffNewBooking: boolean;
  staffNewEnquiry: boolean;
  staffNewReview: boolean;
  promoOnNewOffer: boolean;
}

export interface Subscriber {
  id: string;
  email: string;
  name?: string | null;
  subscribed: boolean;
  source: string;
  createdAt: string;
  unsubscribedAt?: string | null;
}

export interface Campaign {
  id: string;
  subject: string;
  heading?: string | null;
  body: string;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  status: 'DRAFT' | 'SENDING' | 'SENT' | 'FAILED';
  recipientCount: number;
  sentCount: number;
  trigger: string;
  createdAt: string;
  sentAt?: string | null;
}

export interface EmailConfig {
  enabled: boolean;
  provider: 'brevo' | 'smtp';
  apiKeySet: boolean;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  staffRecipients: string[];
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpSecure: boolean;
  events: EmailEvents;
}

export type CouponKind = 'PERCENT' | 'FLAT';

export interface Coupon {
  id: string;
  code: string;
  description?: string | null;
  kind: CouponKind;
  value: number;
  minAmount: number;
  maxDiscount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  active: boolean;
  createdAt: string;
}

export interface Addon {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  complimentary: boolean;
  category?: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

export type BannerType = 'ANNOUNCEMENT' | 'HERO' | 'PROMO';

export interface Banner {
  id: string;
  type: BannerType;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  active: boolean;
  sortOrder: number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
}

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Review {
  id: string;
  author: string;
  email?: string | null;
  stayId?: string | null;
  rating: number;
  title?: string | null;
  body: string;
  status: ReviewStatus;
  reply?: string | null;
  createdAt: string;
}

export interface MediaItem {
  id: string;
  url: string;
  alt?: string | null;
  folder?: string | null;
  createdAt: string;
}

export interface UserDetail extends AdminUser {
  active: boolean;
  createdAt: string;
  bookings?: Booking[];
}

export interface ReportSummary {
  range: { from: string; to: string };
  totals: {
    revenue: number;
    bookings: number;
    nights: number;
    cancelled: number;
    avgBookingValue: number;
    occupancy: number;
  };
  revenueBySource: { label: string; value: number }[];
  revenueByStay: { label: string; value: number }[];
  bookingsByStatus: { label: string; value: number }[];
}

export interface RefundTier {
  minDaysBefore: number;
  refundPercent: number;
}

export interface RefundPolicy {
  fullRefundWithinHours: number;
  tiers: RefundTier[];
}

export interface PaymentAdminConfig {
  provider: 'mock' | 'razorpay';
  testMode: boolean;
  keyId: string;
  keySecretSet: boolean;
  webhookSecretSet: boolean;
  methods: string[];
  depositPercent: number;
  refundPolicy: RefundPolicy;
}

export interface Payment {
  id: string;
  bookingId: string;
  provider: string;
  orderId?: string | null;
  paymentId?: string | null;
  refundId?: string | null;
  amount: number;
  currency: string;
  status: 'CREATED' | 'PAID' | 'FAILED' | 'REFUNDED';
  method?: string | null;
  last4?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  userId?: string | null;
  actor: string;
  action: string;
  entity: string;
  entityId?: string | null;
  createdAt: string;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  occasion?: string | null;
  guests?: number | null;
  message?: string | null;
  status: 'NEW' | 'CONTACTED' | 'CLOSED';
  assignee?: string | null;
  source: string;
  createdAt: string;
}
