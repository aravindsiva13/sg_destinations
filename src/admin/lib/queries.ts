import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from './apiClient';
import type {
  Addon,
  Campaign,
  Subscriber,
  AuditEntry,
  AdminUser,
  AvailabilityResult,
  Banner,
  Booking,
  BookingStatus,
  ContentItem,
  ContentType,
  Coupon,
  DashboardStats,
  DateBlock,
  EmailConfig,
  Enquiry,
  MediaItem,
  MenuCategory,
  MenuItem,
  Paginated,
  Payment,
  PaymentAdminConfig,
  PaymentStatus,
  RateRule,
  ReportSummary,
  Review,
  ReviewStatus,
  Role,
  Stay,
  UserDetail,
} from '../types';

/* ---------------- Dashboard ---------------- */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => (await api.get<DashboardStats>('/api/dashboard/stats')).data,
  });
}

/* ---------------- Bookings ---------------- */
export interface BookingFilters {
  q?: string;
  status?: BookingStatus | '';
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export function useBookings(filters: BookingFilters) {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? 20,
      };
      if (filters.q) params.q = filters.q;
      if (filters.status) params.status = filters.status;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      return (await api.get<Paginated<Booking>>('/api/bookings', { params })).data;
    },
    placeholderData: keepPreviousData,
  });
}

export interface CreateBookingInput {
  stayId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  source: string;
  notes?: string;
  amount?: number; // manual custom-price override
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateBookingInput) =>
      (await api.post<Booking>('/api/bookings', input)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Fetch all bookings matching the given filters (for CSV export).
 * The API caps pageSize at 100, so this walks every page instead of
 * requesting a huge page that would be silently truncated.
 */
export async function fetchAllBookings(filters: BookingFilters): Promise<Booking[]> {
  const all: Booking[] = [];
  const pageSize = 100;
  let page = 1;
  for (;;) {
    const params: Record<string, string | number> = { page, pageSize };
    if (filters.q) params.q = filters.q;
    if (filters.status) params.status = filters.status;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    const { data } = await api.get<Paginated<Booking>>('/api/bookings', { params });
    all.push(...data.data);
    if (page >= data.pageCount) break;
    page += 1;
  }
  return all;
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) =>
      (await api.patch<Booking>(`/api/bookings/${id}/status`, { status })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, paymentStatus }: { id: string; paymentStatus: PaymentStatus }) =>
      (await api.patch<Booking>(`/api/bookings/${id}/payment`, { paymentStatus })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/* ---------------- Stays ---------------- */
export function useStays() {
  return useQuery({
    queryKey: ['stays'],
    queryFn: async () => (await api.get<Stay[]>('/api/stays')).data,
  });
}

export type StayInput = Omit<Stay, 'id' | 'createdAt' | 'updatedAt'>;

export function useCreateStay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StayInput) => (await api.post<Stay>('/api/stays', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stays'] }),
  });
}

export function useUpdateStay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<StayInput> }) =>
      (await api.patch<Stay>(`/api/stays/${id}`, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stays'] }),
  });
}

export function useDeleteStay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/stays/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stays'] }),
  });
}

/* ---------------- Enquiries ---------------- */
export function useEnquiries() {
  return useQuery({
    queryKey: ['enquiries'],
    queryFn: async () => (await api.get<Enquiry[]>('/api/enquiries')).data,
  });
}

export function useUpdateEnquiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: {
      id: string;
      status?: Enquiry['status'];
      assignee?: string | null;
    }) => (await api.patch<Enquiry>(`/api/enquiries/${id}`, patch)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enquiries'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/* ---------------- Availability & Pricing ---------------- */
export interface RateRuleInput {
  name: string;
  stayId?: string | null;
  startDate: string;
  endDate: string;
  kind: RateRule['kind'];
  amount: number;
  minStay: number;
  priority: number;
  active: boolean;
}

export function useRateRules() {
  return useQuery({
    queryKey: ['rate-rules'],
    queryFn: async () => (await api.get<RateRule[]>('/api/availability/rate-rules')).data,
  });
}

export function useCreateRateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RateRuleInput) =>
      (await api.post<RateRule>('/api/availability/rate-rules', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rate-rules'] }),
  });
}

export function useUpdateRateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<RateRuleInput> }) =>
      (await api.patch<RateRule>(`/api/availability/rate-rules/${id}`, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rate-rules'] }),
  });
}

export function useDeleteRateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/availability/rate-rules/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rate-rules'] }),
  });
}

export function useBlocks() {
  return useQuery({
    queryKey: ['blocks'],
    queryFn: async () => (await api.get<DateBlock[]>('/api/availability/blocks')).data,
  });
}

export interface BlockInput {
  stayId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export function useCreateBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BlockInput) =>
      (await api.post<DateBlock>('/api/availability/blocks', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blocks'] }),
  });
}

export function useDeleteBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/availability/blocks/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blocks'] }),
  });
}

/** One-shot availability checker (not cached as a query). */
export async function checkAvailability(input: {
  checkIn: string;
  checkOut: string;
  guests: number;
}): Promise<AvailabilityResult[]> {
  const { data } = await api.post<{ results: AvailabilityResult[] }>(
    '/api/availability/check',
    input,
  );
  return data.results;
}

/* ---------------- Content (Amenities / Dining / Events / Offers) ---------------- */
const typePath = (t: ContentType) => t.toLowerCase();

export type ContentInput = Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>;

export function useContent(type: ContentType) {
  return useQuery({
    queryKey: ['content', type],
    queryFn: async () => (await api.get<ContentItem[]>(`/api/content/${typePath(type)}`)).data,
  });
}

export function useCreateContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ContentInput) => (await api.post<ContentItem>('/api/content', input)).data,
    onSuccess: (item) => qc.invalidateQueries({ queryKey: ['content', item.type] }),
  });
}

export function useUpdateContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<ContentInput> }) =>
      (await api.patch<ContentItem>(`/api/content/${id}`, input)).data,
    onSuccess: (item) => qc.invalidateQueries({ queryKey: ['content', item.type] }),
  });
}

export function useDeleteContent(type: ContentType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/content/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content', type] }),
  });
}

/* ---------------- Menu (food) ---------------- */
export type MenuCategoryInput = Pick<MenuCategory, 'name'> &
  Partial<Pick<MenuCategory, 'note' | 'published' | 'sortOrder'>>;
export type MenuItemInput = Pick<MenuItem, 'categoryId' | 'name' | 'price'> &
  Partial<Pick<MenuItem, 'veg' | 'available' | 'sortOrder'>>;

export function useMenu() {
  return useQuery({
    queryKey: ['menu'],
    queryFn: async () => (await api.get<MenuCategory[]>('/api/menu/all')).data,
  });
}

export function useCreateMenuCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: MenuCategoryInput) =>
      (await api.post<MenuCategory>('/api/menu/categories', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  });
}
export function useUpdateMenuCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<MenuCategoryInput> }) =>
      (await api.patch<MenuCategory>(`/api/menu/categories/${id}`, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  });
}
export function useDeleteMenuCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/menu/categories/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  });
}

export function useCreateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: MenuItemInput) => (await api.post<MenuItem>('/api/menu/items', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  });
}
export function useUpdateMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<MenuItemInput> }) =>
      (await api.patch<MenuItem>(`/api/menu/items/${id}`, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  });
}
export function useDeleteMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/menu/items/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu'] }),
  });
}

/* ---------------- Add-ons ---------------- */
export type AddonInput = Omit<Addon, 'id' | 'createdAt'>;

export function useAddons() {
  return useQuery({
    queryKey: ['addons'],
    queryFn: async () => (await api.get<Addon[]>('/api/addons/all')).data,
  });
}
export function useCreateAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddonInput) => (await api.post<Addon>('/api/addons', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addons'] }),
  });
}
export function useUpdateAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<AddonInput> }) =>
      (await api.patch<Addon>(`/api/addons/${id}`, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addons'] }),
  });
}
export function useDeleteAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/addons/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addons'] }),
  });
}

/* ---------------- Marketing (subscribers + campaigns) ---------------- */
export function useSubscribers() {
  return useQuery({
    queryKey: ['subscribers'],
    queryFn: async () =>
      (await api.get<{ subscribers: Subscriber[]; active: number; total: number }>('/api/marketing/subscribers')).data,
  });
}

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => (await api.get<Campaign[]>('/api/marketing/campaigns')).data,
  });
}

export interface CampaignInput {
  subject: string;
  heading?: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  send?: boolean;
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CampaignInput) =>
      (await api.post<Campaign & { sent?: number; total?: number }>('/api/marketing/campaigns', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

export function useSendCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      (await api.post<Campaign & { sent: number; total: number }>(`/api/marketing/campaigns/${id}/send`, {})).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

/* ---------------- Email ---------------- */
export type EmailConfigInput = Partial<
  Omit<EmailConfig, 'apiKeySet'> & { apiKey: string }
>;

export function useEmailConfig() {
  return useQuery({
    queryKey: ['email-config'],
    queryFn: async () => (await api.get<EmailConfig>('/api/email/config')).data,
  });
}
export function useSaveEmailConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EmailConfigInput) =>
      (await api.put<EmailConfig>('/api/email/config', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-config'] }),
  });
}
export function useSendTestEmail() {
  return useMutation({
    mutationFn: async (to: string) => (await api.post<{ ok: boolean }>('/api/email/test', { to })).data,
  });
}

/* ---------------- Coupons ---------------- */
export type CouponInput = Omit<Coupon, 'id' | 'createdAt' | 'usedCount'>;

export function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: async () => (await api.get<Coupon[]>('/api/coupons')).data,
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CouponInput) => (await api.post<Coupon>('/api/coupons', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CouponInput> }) =>
      (await api.patch<Coupon>(`/api/coupons/${id}`, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/coupons/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  });
}

/* ---------------- Banners ---------------- */
export type BannerInput = Omit<Banner, 'id' | 'createdAt'>;

export function useBanners() {
  return useQuery({
    queryKey: ['banners'],
    queryFn: async () => (await api.get<Banner[]>('/api/banners/all')).data,
  });
}
export function useCreateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BannerInput) => (await api.post<Banner>('/api/banners', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banners'] }),
  });
}
export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<BannerInput> }) =>
      (await api.patch<Banner>(`/api/banners/${id}`, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banners'] }),
  });
}
export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/banners/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banners'] }),
  });
}

/* ---------------- Reviews ---------------- */
export function useReviews(status?: ReviewStatus | '') {
  return useQuery({
    queryKey: ['reviews', status ?? 'all'],
    queryFn: async () => {
      const params = status ? { status } : undefined;
      return (await api.get<Review[]>('/api/reviews/admin', { params })).data;
    },
  });
}
export function useModerateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; status?: ReviewStatus; reply?: string | null }) =>
      (await api.patch<Review>(`/api/reviews/${id}`, patch)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
}
export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/reviews/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
}

/* ---------------- Users & Staff ---------------- */
export function useUsers(role?: Role | '', q?: string) {
  return useQuery({
    queryKey: ['users', role ?? 'all', q ?? ''],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (role) params.role = role;
      if (q) params.q = q;
      return (await api.get<UserDetail[]>('/api/users', { params })).data;
    },
  });
}
export function useUserDetail(id: string | null) {
  return useQuery({
    queryKey: ['user', id],
    enabled: !!id,
    queryFn: async () => (await api.get<UserDetail>(`/api/users/${id}`)).data,
  });
}
export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
}
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateUserInput) => (await api.post<AdminUser>('/api/users', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CreateUserInput> & { active?: boolean } }) =>
      (await api.patch<AdminUser>(`/api/users/${id}`, input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

/* ---------------- Settings ---------------- */
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<Record<string, unknown>>('/api/settings')).data,
  });
}
export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Record<string, unknown>) =>
      (await api.put<Record<string, unknown>>('/api/settings', patch)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}

/* ---------------- Media ---------------- */
export function useMedia() {
  return useQuery({
    queryKey: ['media'],
    queryFn: async () => (await api.get<MediaItem[]>('/api/media')).data,
  });
}
export function useAddMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { url: string; alt?: string; folder?: string }) =>
      (await api.post<MediaItem>('/api/media', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  });
}
export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.delete(`/api/media/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  });
}

/* ---------------- Reports ---------------- */
export function useReport(from?: string, to?: string) {
  return useQuery({
    queryKey: ['report', from ?? '', to ?? ''],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      return (await api.get<ReportSummary>('/api/reports/summary', { params })).data;
    },
  });
}

/* ---------------- Payments ---------------- */
export function usePaymentConfig() {
  return useQuery({
    queryKey: ['payment-config'],
    queryFn: async () => (await api.get<PaymentAdminConfig>('/api/payments/config')).data,
  });
}

export function useSavePaymentConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<PaymentAdminConfig> & { keySecret?: string; webhookSecret?: string }) =>
      (await api.put<PaymentAdminConfig>('/api/payments/config', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment-config'] }),
  });
}

export function useBookingPayments(bookingId: string | null) {
  return useQuery({
    queryKey: ['payments', bookingId],
    enabled: !!bookingId,
    queryFn: async () => (await api.get<Payment[]>(`/api/payments/booking/${bookingId}`)).data,
  });
}

export function useRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) =>
      (await api.post<{ refundId: string; refundAmount: number; penalty: number }>(
        `/api/payments/${bookingId}/refund`,
        {},
      )).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/* ---------------- Audit log ---------------- */
export function useAudit(page: number, entity?: string) {
  return useQuery({
    queryKey: ['audit', page, entity ?? 'all'],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, pageSize: 30 };
      if (entity) params.entity = entity;
      return (await api.get<Paginated<AuditEntry>>('/api/audit', { params })).data;
    },
    placeholderData: keepPreviousData,
  });
}
