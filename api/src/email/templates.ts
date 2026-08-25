import type { Booking, Enquiry, Review, Stay } from '@prisma/client';

export interface Brand {
  name: string;
  email: string;
  phone: string;
  address: string;
  checkInTime: string;
  checkOutTime: string;
}

export interface Rendered {
  subject: string;
  html: string;
}

const rupee = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

/** HTML-escape user-supplied text before it is interpolated into emails. */
const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Shared branded shell (inline styles — required for email clients). */
function layout(brand: Brand, heading: string, bodyHtml: string): string {
  return `
  <div style="margin:0;padding:0;background:#f4f1ea;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#2b2b2b;">
    <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
      <div style="background:#1f3d2b;border-radius:14px 14px 0 0;padding:22px 28px;">
        <div style="color:#f4f1ea;font-size:20px;font-weight:600;letter-spacing:.3px;">${esc(brand.name)}</div>
      </div>
      <div style="background:#ffffff;padding:28px;border:1px solid #e7e2d6;border-top:0;">
        <h1 style="margin:0 0 16px;font-size:20px;color:#1f3d2b;">${esc(heading)}</h1>
        ${bodyHtml}
      </div>
      <div style="background:#faf8f2;border:1px solid #e7e2d6;border-top:0;border-radius:0 0 14px 14px;padding:18px 28px;font-size:12px;color:#6b6b6b;line-height:1.6;">
        <strong>${esc(brand.name)}</strong><br/>
        ${esc(brand.address)}<br/>
        ${brand.phone ? `Phone: ${esc(brand.phone)} &nbsp;·&nbsp; ` : ''}${brand.email ? `Email: ${esc(brand.email)}` : ''}
      </div>
    </div>
  </div>`;
}

function bookingTable(brand: Brand, booking: Booking, stay: Stay): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 0;color:#6b6b6b;">${esc(label)}</td><td style="padding:6px 0;text-align:right;font-weight:600;">${esc(value)}</td></tr>`;
  return `
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin:8px 0 4px;">
    ${row('Booking reference', booking.code)}
    ${row('Stay', stay.name)}
    ${row('Check-in', `${fmtDate(booking.checkIn)} · ${brand.checkInTime}`)}
    ${row('Check-out', `${fmtDate(booking.checkOut)} · ${brand.checkOutTime}`)}
    ${row('Nights', String(booking.nights))}
    ${row('Guests', String(booking.guests))}
    <tr><td colspan="2" style="border-top:1px solid #eee;padding-top:8px;"></td></tr>
    ${row('Total amount', rupee(booking.amount))}
  </table>`;
}

const p = (t: string) => `<p style="margin:0 0 14px;font-size:14px;line-height:1.65;">${t}</p>`;

/* ------------------------------ Guest emails ------------------------------ */
export function passwordReset(brand: Brand, name: string, resetUrl: string): Rendered {
  return {
    subject: `Reset your password · ${brand.name}`,
    html: layout(
      brand,
      `Reset your password`,
      p(`Hi ${esc(name.split(' ')[0])}, we received a request to reset the password for your ${brand.name} account.`) +
        `<p style="margin:22px 0;"><a href="${esc(resetUrl)}" style="display:inline-block;background:#1f3d2b;color:#f4f1ea;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600;">Reset password</a></p>` +
        p(`This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't be changed.`),
    ),
  };
}


export function bookingReceived(brand: Brand, booking: Booking, stay: Stay): Rendered {
  return {
    subject: `We've received your booking · ${booking.code}`,
    html: layout(
      brand,
      `Thank you, ${esc(booking.customerName.split(' ')[0])}!`,
      p(`We've received your booking request at <strong>${esc(brand.name)}</strong>. Here are the details:`) +
        bookingTable(brand, booking, stay) +
        p('Your booking is currently <strong>pending payment</strong>. Once payment is confirmed, we\'ll send your final confirmation.') +
        p(`Questions? Just reply to this email${brand.phone ? ` or call us at ${esc(brand.phone)}` : ''}.`),
    ),
  };
}

export function bookingConfirmed(brand: Brand, booking: Booking, stay: Stay): Rendered {
  return {
    subject: `Booking confirmed ✓ · ${booking.code}`,
    html: layout(
      brand,
      'Your booking is confirmed 🎉',
      p(`Dear ${esc(booking.customerName)}, we're delighted to confirm your stay at <strong>${esc(brand.name)}</strong>. This email is your receipt.`) +
        bookingTable(brand, booking, stay) +
        p(`<strong>Payment status:</strong> Paid`) +
        p(`We look forward to welcoming you. Check-in is from ${esc(brand.checkInTime)} on ${fmtDate(booking.checkIn)}.`),
    ),
  };
}

export function bookingCancelled(brand: Brand, booking: Booking, stay: Stay): Rendered {
  return {
    subject: `Booking cancelled · ${booking.code}`,
    html: layout(
      brand,
      'Your booking has been cancelled',
      p(`Dear ${esc(booking.customerName)}, your booking <strong>${esc(booking.code)}</strong> for ${esc(stay.name)} has been cancelled.`) +
        p(`If a refund applies under our cancellation policy, it will be processed to your original payment method.`) +
        p(`If this was a mistake or you'd like to rebook, just reply to this email${brand.phone ? ` or call ${esc(brand.phone)}` : ''}.`),
    ),
  };
}

export function checkInReminder(brand: Brand, booking: Booking, stay: Stay): Rendered {
  return {
    subject: `See you tomorrow! · ${brand.name}`,
    html: layout(
      brand,
      `Your stay is almost here, ${booking.customerName.split(' ')[0]}!`,
      p(`We're looking forward to welcoming you to <strong>${esc(brand.name)}</strong> tomorrow.`) +
        bookingTable(brand, booking, stay) +
        p(`Check-in opens at <strong>${esc(brand.checkInTime)}</strong>.${brand.address ? ` Our address: ${esc(brand.address)}.` : ''}`) +
        p(`Safe travels — see you soon!`),
    ),
  };
}

export function reviewRequest(brand: Brand, booking: Booking, stay: Stay): Rendered {
  return {
    subject: `How was your stay at ${brand.name}?`,
    html: layout(
      brand,
      `Thank you for staying with us, ${booking.customerName.split(' ')[0]}!`,
      p(`We hope you enjoyed your time at <strong>${stay.name}</strong>. Your feedback means the world to us and helps other guests.`) +
        p(`Would you take a moment to share a quick review? Simply reply to this email with your thoughts, or leave us a rating on our website.`) +
        p(`We'd love to welcome you back soon.`),
    ),
  };
}

export function enquiryAck(brand: Brand, enquiry: Enquiry): Rendered {
  return {
    subject: `We've received your enquiry · ${brand.name}`,
    html: layout(
      brand,
      `Thank you for reaching out, ${esc(enquiry.name.split(' ')[0])}!`,
      p(`We've received your enquiry and our team will get back to you shortly${brand.phone ? `, or you can reach us directly at ${esc(brand.phone)}` : ''}.`) +
        (enquiry.message ? p(`<em>Your message:</em><br/>"${esc(enquiry.message)}"`) : '') +
        p(`Warm regards,<br/>The ${esc(brand.name)} team`),
    ),
  };
}

/* ------------------------------ Staff emails ------------------------------ */
export function staffNewBooking(brand: Brand, booking: Booking, stay: Stay): Rendered {
  return {
    subject: `New booking · ${booking.code} · ${stay.name}`,
    html: layout(
      brand,
      'New booking received',
      bookingTable(brand, booking, stay) +
        p(`<strong>Guest:</strong> ${esc(booking.customerName)}<br/><strong>Email:</strong> ${esc(booking.customerEmail)}<br/>${booking.customerPhone ? `<strong>Phone:</strong> ${esc(booking.customerPhone)}<br/>` : ''}<strong>Source:</strong> ${esc(booking.source)}`),
    ),
  };
}

export function staffNewEnquiry(brand: Brand, enquiry: Enquiry): Rendered {
  return {
    subject: `New enquiry from ${enquiry.name}`,
    html: layout(
      brand,
      'New enquiry received',
p(
        `<strong>Name:</strong> ${esc(enquiry.name)}<br/><strong>Email:</strong> ${esc(enquiry.email)}<br/>${enquiry.phone ? `<strong>Phone:</strong> ${esc(enquiry.phone)}<br/>` : ''}${enquiry.occasion ? `<strong>Occasion:</strong> ${esc(enquiry.occasion)}<br/>` : ''}${enquiry.guests ? `<strong>Guests:</strong> ${esc(enquiry.guests)}<br/>` : ''}`,
      ) + (enquiry.message ? p(`<strong>Message:</strong><br/>${esc(enquiry.message)}`) : ''),
    ),
  };
}

export function staffNewReview(brand: Brand, review: Review): Rendered {
  return {
    subject: `New ${review.rating}★ review from ${review.author}`,
    html: layout(
      brand,
      'New review awaiting approval',
      p(`<strong>${esc(review.author)}</strong> left a <strong>${esc(review.rating)}★</strong> review${review.title ? `: "${esc(review.title)}"` : ''}.`) +
        p(`"${esc(review.body)}"`) +
        p(`Approve or reject it from the admin portal → Reviews.`),
    ),
  };
}

/* ---------------------------- Marketing emails ---------------------------- */
export interface PromoContent {
  subject: string;
  heading: string;
  paragraphs: string[];
  ctaLabel?: string | null;
  ctaHref?: string | null;
}

/** A promotional email with a required unsubscribe link in the footer. */
export function promotional(brand: Brand, promo: PromoContent, unsubscribeUrl: string): Rendered {
  const body =
    promo.paragraphs.map((para) => p(esc(para))).join('') +
    (promo.ctaLabel && promo.ctaHref
      ? `<p style="margin:22px 0 6px;"><a href="${esc(promo.ctaHref)}" style="display:inline-block;background:#1f3d2b;color:#f4f1ea;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600;">${esc(promo.ctaLabel)}</a></p>`
      : '');

  // layout() has a fixed footer; append an unsubscribe line after it.
  const html =
    layout(brand, esc(promo.heading), body) +
    `<div style="max-width:560px;margin:-8px auto 24px;padding:0 16px;text-align:center;font-size:11px;color:#9a958a;">
       You're receiving this because you opted in at ${esc(brand.name)}.
       <a href="${esc(unsubscribeUrl)}" style="color:#9a958a;text-decoration:underline;">Unsubscribe</a>.
     </div>`;
  return { subject: promo.subject, html };
}

export function testEmail(brand: Brand): Rendered {
  return {
    subject: `Test email from ${brand.name} ✓`,
    html: layout(
      brand,
      'Your email settings work! 🎉',
      p(`This is a test message from your ${brand.name} admin portal.`) +
        p(`If you're reading this, your email configuration is set up correctly and guests will receive their booking emails.`),
    ),
  };
}
