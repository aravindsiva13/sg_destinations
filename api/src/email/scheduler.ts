import { prisma } from '../prisma.js';
import { getEmailConfig } from './config.js';
import { sendMail } from './mailer.js';
import * as T from './templates.js';
import type { Brand } from './templates.js';

const HOUR = 60 * 60 * 1000;

async function brandFromSettings(): Promise<Brand> {
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

async function runOnce(): Promise<void> {
  const cfg = await getEmailConfig();
  if (!cfg.enabled) return;
  const now = new Date();
  const brand = await brandFromSettings();

  // 1) Check-in reminders: confirmed bookings arriving within ~36h, not yet reminded.
  if (cfg.events.checkInReminder) {
    const soon = new Date(now.getTime() + 36 * HOUR);
    const arriving = await prisma.booking.findMany({
      where: { status: 'CONFIRMED', reminderSentAt: null, checkIn: { gte: now, lte: soon } },
      include: { stay: true },
    });
    for (const b of arriving) {
      const t = T.checkInReminder(brand, b, b.stay);
      const r = await sendMail({ to: b.customerEmail, subject: t.subject, html: t.html }, cfg);
      if (r.ok) await prisma.booking.update({ where: { id: b.id }, data: { reminderSentAt: new Date() } });
      else console.warn(`[email] reminder not sent for ${b.code}: ${r.error}`);
    }
  }

  // 2) Review requests: bookings that checked out in the last 3 days, not yet asked.
  if (cfg.events.reviewRequest) {
    const since = new Date(now.getTime() - 72 * HOUR);
    const departed = await prisma.booking.findMany({
      where: {
        reviewRequestSentAt: null,
        checkOut: { gte: since, lte: now },
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
      },
      include: { stay: true },
    });
    for (const b of departed) {
      const t = T.reviewRequest(brand, b, b.stay);
      const r = await sendMail({ to: b.customerEmail, subject: t.subject, html: t.html }, cfg);
      if (r.ok) await prisma.booking.update({ where: { id: b.id }, data: { reviewRequestSentAt: new Date() } });
      else console.warn(`[email] review request not sent for ${b.code}: ${r.error}`);
    }
  }
}

/** Start the hourly email scheduler (check-in reminders + review requests). */
export function startEmailScheduler(): ReturnType<typeof setInterval> {
  const tick = () => {
    runOnce().catch((e) => console.warn('[email] scheduler tick failed', e));
  };
  // Run shortly after boot, then every hour. The initial run is unref'd so it
  // never keeps the process alive during a graceful shutdown.
  setTimeout(tick, 30_000).unref();
  return setInterval(tick, HOUR);
}
