import type { BookingStatus, PaymentStatus, Role } from './types';

export const ADMIN_ROLES: Role[] = ['SUPER_ADMIN', 'MANAGER', 'FRONT_DESK'];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  MANAGER: 'Manager',
  FRONT_DESK: 'Front Desk',
  CUSTOMER: 'Customer',
};

export const BOOKING_STATUS_META: Record<
  BookingStatus,
  { label: string; tone: 'amber' | 'green' | 'blue' | 'slate' | 'red' }
> = {
  PENDING: { label: 'Pending', tone: 'amber' },
  RESERVED: { label: 'Reserved', tone: 'blue' },
  CONFIRMED: { label: 'Confirmed', tone: 'green' },
  CHECKED_IN: { label: 'Checked in', tone: 'blue' },
  CHECKED_OUT: { label: 'Checked out', tone: 'slate' },
  CANCELLED: { label: 'Cancelled', tone: 'red' },
};

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; tone: 'amber' | 'green' | 'red' }
> = {
  UNPAID: { label: 'Unpaid', tone: 'amber' },
  PARTIAL: { label: 'Part-paid', tone: 'amber' },
  PAID: { label: 'Paid', tone: 'green' },
  REFUNDED: { label: 'Refunded', tone: 'red' },
};

/** Allowed next statuses from a given status (mirrors the API state machine). */
export const BOOKING_NEXT: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['RESERVED', 'CONFIRMED', 'CANCELLED'],
  RESERVED: ['CONFIRMED', 'CHECKED_IN', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELLED'],
  CHECKED_IN: ['CHECKED_OUT'],
  CHECKED_OUT: [],
  CANCELLED: [],
};

/** Seeded staff names for assignment (replaced by the Users API in Phase 4). */
export const STAFF = ['Eloise Vance', 'Marcus Hume', 'Sophia Lin'];

export const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
