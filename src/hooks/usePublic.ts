import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../lib/publicApi';
import type {
  ApiAddon,
  ApiBanner,
  ApiContent,
  ApiMenuCategory,
  ApiReview,
  ApiStay,
  AvailabilityResult,
  CouponResult,
} from '../lib/publicTypes';

type ContentType = 'amenity' | 'dining' | 'event' | 'offer';

/* -------------------------------- Stays -------------------------------- */
export function useStays() {
  return useQuery({
    queryKey: ['public', 'stays'],
    queryFn: async () => (await publicApi.get<ApiStay[]>('/api/stays', { params: { published: true } })).data,
  });
}

export function useStay(slug?: string) {
  return useQuery({
    queryKey: ['public', 'stay', slug],
    enabled: !!slug,
    queryFn: async () => (await publicApi.get<ApiStay>(`/api/stays/${slug}`)).data,
  });
}

/* ------------------------------- Content ------------------------------- */
export function useContentList(type: ContentType) {
  return useQuery({
    queryKey: ['public', 'content', type],
    queryFn: async () =>
      (await publicApi.get<ApiContent[]>(`/api/content/${type}`, { params: { published: true } })).data,
  });
}

export function useContentItem(type: ContentType, slug?: string) {
  return useQuery({
    queryKey: ['public', 'content', type, slug],
    enabled: !!slug,
    queryFn: async () => (await publicApi.get<ApiContent>(`/api/content/${type}/${slug}`)).data,
  });
}

/* -------------------------------- Menu --------------------------------- */
export function useMenu() {
  return useQuery({
    queryKey: ['public', 'menu'],
    queryFn: async () => (await publicApi.get<ApiMenuCategory[]>('/api/menu')).data,
    staleTime: 60_000,
  });
}

/* ------------------------------- Add-ons ------------------------------- */
export function useAddons() {
  return useQuery({
    queryKey: ['public', 'addons'],
    queryFn: async () => (await publicApi.get<ApiAddon[]>('/api/addons')).data,
    staleTime: 60_000,
  });
}

/* ------------------------------- Banners ------------------------------- */
export function useBanners(type?: ApiBanner['type']) {
  return useQuery({
    queryKey: ['public', 'banners', type ?? 'all'],
    queryFn: async () =>
      (await publicApi.get<ApiBanner[]>('/api/banners', { params: type ? { type } : undefined })).data,
    staleTime: 60_000,
  });
}

/* ------------------------------- Reviews ------------------------------- */
export function useReviews(stayId?: string) {
  return useQuery({
    queryKey: ['public', 'reviews', stayId ?? 'all'],
    queryFn: async () =>
      (await publicApi.get<ApiReview[]>('/api/reviews', { params: stayId ? { stayId } : undefined })).data,
  });
}

export async function submitReview(input: {
  author: string;
  email?: string;
  stayId?: string;
  rating: number;
  title?: string;
  body: string;
}): Promise<{ id: string; status: string }> {
  const { data } = await publicApi.post('/api/reviews', input);
  return data;
}

/* ------------------------------ Settings ------------------------------- */
export function useSettings() {
  return useQuery({
    queryKey: ['public', 'settings'],
    queryFn: async () => (await publicApi.get<Record<string, unknown>>('/api/settings')).data,
    staleTime: 300_000,
  });
}

/* --------------------- Availability & coupon (imperative) --------------------- */
export async function checkAvailability(input: {
  checkIn: string;
  checkOut: string;
  guests: number;
  stayId?: string;
}): Promise<AvailabilityResult[]> {
  const { data } = await publicApi.post<{ results: AvailabilityResult[] }>('/api/availability/check', input);
  return data.results;
}

export async function validateCoupon(code: string, amount: number): Promise<CouponResult> {
  const { data } = await publicApi.post<CouponResult>('/api/coupons/validate', { code, amount });
  return data;
}

export async function createBooking(input: {
  stayId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  couponCode?: string;
  food?: { itemId: string; qty: number }[];
  addonIds?: string[];
  source?: string;
  notes?: string;
}) {
  const { data } = await publicApi.post('/api/bookings/public', input);
  return data as {
    id: string;
    code: string;
    amount: number;
    nights: number;
    discount: number;
    subtotal: number;
    roomAmount: number;
    foodAmount: number;
    addonsAmount: number;
  };
}

/* ------------------------------- Payments ------------------------------- */
export interface PaymentPublicConfig {
  provider: 'mock' | 'razorpay';
  testMode: boolean;
  keyId: string;
  methods: string[];
  depositPercent: number;
}

export function usePaymentConfig() {
  return useQuery({
    queryKey: ['public', 'payment-config'],
    queryFn: async () => (await publicApi.get<PaymentPublicConfig>('/api/payments/public-config')).data,
    staleTime: 300_000,
  });
}

export interface PaymentOrder {
  paymentRecordId: string;
  orderId: string;
  amount: number;
  currency: string;
  provider: 'mock' | 'razorpay';
  keyId: string;
  methods: string[];
  bookingCode: string;
}

export async function createPaymentOrder(bookingId: string, payFull = true): Promise<PaymentOrder> {
  return (await publicApi.post<PaymentOrder>('/api/payments/order', { bookingId, payFull })).data;
}

export async function verifyPayment(input: {
  paymentRecordId: string;
  mockSuccess?: boolean;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}): Promise<{ status: string; bookingCode: string }> {
  return (await publicApi.post('/api/payments/verify', input)).data;
}

export async function subscribeNewsletter(email: string, name?: string) {
  const { data } = await publicApi.post('/api/marketing/subscribe', { email, name });
  return data as { ok: boolean };
}

export async function createEnquiry(input: {
  name: string;
  email: string;
  phone?: string;
  occasion?: string;
  guests?: number;
  message?: string;
}) {
  const { data } = await publicApi.post('/api/enquiries', input);
  return data;
}
