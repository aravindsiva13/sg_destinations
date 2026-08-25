import type { Booking, Enquiry, Review, Stay } from '@prisma/client';
import { prisma } from '../prisma.js';
import { getEmailConfig, type EmailConfig, type EmailEvents } from './config.js';
import { sendMail } from './mailer.js';
import * as T from './templates.js';
import type { Brand } from './templates.js';

/** Load resort branding from SiteSetting (with sensible fallbacks). */
export async function getBrand(): Promise<Brand> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ['resortName', 'contactEmail', 'contactPhone', 'address', 'checkInTime', 'checkOutTime'] } },
  });
  const s: Record<string, string> = {};
  for (const r of rows) {
    try {
      s[r.key] = String(JSON.parse(r.value));
    } catch {
      s[r.key] = r.value;
    }
  }
  return {
    name: s.resortName || 'Shraddha Garden Resort',
    email: s.contactEmail || '',
    phone: s.contactPhone || '',
    address: s.address || '',
    checkInTime: s.checkInTime || '14:00',
    checkOutTime: s.checkOutTime || '11:00',
  };
}

/** Resolve config once and guard on enabled + the specific toggle. */
async function ready(event: keyof EmailEvents): Promise<{ cfg: EmailConfig; brand: Brand } | null> {
  const cfg = await getEmailConfig();
  if (!cfg.enabled || !cfg.events[event]) return null;
  return { cfg, brand: await getBrand() };
}

function log(label: string, r: { ok: boolean; error?: string }) {
  if (!r.ok) console.warn(`[email] ${label} not sent: ${r.error}`);
}

/* --------------------------- public trigger helpers --------------------------- */
export async function onEnquiryCreated(enquiry: Enquiry): Promise<void> {
  try {
    const guest = await ready('enquiryAck');
    if (guest && enquiry.email) {
      const t = T.enquiryAck(guest.brand, enquiry);
      log('enquiry ack', await sendMail({ to: enquiry.email, subject: t.subject, html: t.html }, guest.cfg));
    }
    const staff = await ready('staffNewEnquiry');
    if (staff && staff.cfg.staffRecipients.length) {
      const t = T.staffNewEnquiry(staff.brand, enquiry);
      log('staff enquiry', await sendMail({ to: staff.cfg.staffRecipients, subject: t.subject, html: t.html, replyTo: enquiry.email }, staff.cfg));
    }
  } catch (e) {
    console.warn('[email] onEnquiryCreated failed', e);
  }
}

export async function onBookingReceived(booking: Booking, stay: Stay): Promise<void> {
  try {
    const guest = await ready('bookingReceived');
    if (guest) {
      const t = T.bookingReceived(guest.brand, booking, stay);
      log('booking received', await sendMail({ to: booking.customerEmail, subject: t.subject, html: t.html }, guest.cfg));
    }
    const staff = await ready('staffNewBooking');
    if (staff && staff.cfg.staffRecipients.length) {
      const t = T.staffNewBooking(staff.brand, booking, stay);
      log('staff booking', await sendMail({ to: staff.cfg.staffRecipients, subject: t.subject, html: t.html }, staff.cfg));
    }
  } catch (e) {
    console.warn('[email] onBookingReceived failed', e);
  }
}

export async function onBookingConfirmed(booking: Booking, stay: Stay): Promise<void> {
  try {
    const guest = await ready('bookingConfirmed');
    if (!guest) return;
    const t = T.bookingConfirmed(guest.brand, booking, stay);
    log('booking confirmed', await sendMail({ to: booking.customerEmail, subject: t.subject, html: t.html }, guest.cfg));
  } catch (e) {
    console.warn('[email] onBookingConfirmed failed', e);
  }
}

export async function onBookingCancelled(booking: Booking, stay: Stay): Promise<void> {
  try {
    const guest = await ready('bookingCancelled');
    if (!guest) return;
    const t = T.bookingCancelled(guest.brand, booking, stay);
    log('booking cancelled', await sendMail({ to: booking.customerEmail, subject: t.subject, html: t.html }, guest.cfg));
  } catch (e) {
    console.warn('[email] onBookingCancelled failed', e);
  }
}

export async function onReviewCreated(review: Review): Promise<void> {
  try {
    const staff = await ready('staffNewReview');
    if (!staff || !staff.cfg.staffRecipients.length) return;
    const t = T.staffNewReview(staff.brand, review);
    log('staff review', await sendMail({ to: staff.cfg.staffRecipients, subject: t.subject, html: t.html }, staff.cfg));
  } catch (e) {
    console.warn('[email] onReviewCreated failed', e);
  }
}
