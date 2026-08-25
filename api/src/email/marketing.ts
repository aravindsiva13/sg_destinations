import crypto from 'node:crypto';
import type { Campaign } from '@prisma/client';
import { prisma } from '../prisma.js';
import { env } from '../env.js';
import { getEmailConfig } from './config.js';
import { getBrand } from './notify.js';
import { sendMail } from './mailer.js';
import { promotional, type PromoContent } from './templates.js';

const newToken = () => crypto.randomBytes(24).toString('hex');

/** Add a subscriber (or re-subscribe an existing, unsubscribed one). */
export async function addSubscriber(email: string, name?: string, source = 'signup') {
  const normalized = email.trim().toLowerCase();
  const existing = await prisma.subscriber.findUnique({ where: { email: normalized } });
  if (existing) {
    if (!existing.subscribed) {
      return prisma.subscriber.update({
        where: { id: existing.id },
        data: { subscribed: true, unsubscribedAt: null, name: name ?? existing.name },
      });
    }
    return existing;
  }
  return prisma.subscriber.create({
    data: { email: normalized, name: name ?? null, token: newToken(), source },
  });
}

/** Fire-and-forget: subscribe a checkout guest (never throws). */
export async function subscribeGuest(email: string, name?: string): Promise<void> {
  try {
    await addSubscriber(email, name, 'checkout');
  } catch (e) {
    console.warn('[marketing] subscribeGuest failed', e);
  }
}

const unsubscribeUrl = (token: string) => `${env.publicUrl}/api/marketing/unsubscribe?token=${token}`;

/**
 * Send a campaign to every currently-subscribed address. Updates the campaign's
 * counts and status. Guarded by the email config being enabled.
 */
export async function sendCampaign(campaign: Campaign): Promise<{ sent: number; total: number }> {
  const cfg = await getEmailConfig();
  const brand = await getBrand();
  const subs = await prisma.subscriber.findMany({ where: { subscribed: true } });

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: 'SENDING', recipientCount: subs.length },
  });

  const content: PromoContent = {
    subject: campaign.subject,
    heading: campaign.heading || campaign.subject,
    paragraphs: campaign.body.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean),
    ctaLabel: campaign.ctaLabel,
    ctaHref: campaign.ctaHref,
  };

  let sent = 0;
  for (const sub of subs) {
    const rendered = promotional(brand, content, unsubscribeUrl(sub.token));
    const r = await sendMail({ to: sub.email, subject: rendered.subject, html: rendered.html }, { ...cfg, enabled: true });
    if (r.ok) sent++;
  }

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: cfg.enabled ? 'SENT' : 'FAILED', sentCount: sent, sentAt: new Date() },
  });
  return { sent, total: subs.length };
}

/**
 * Auto-promo: when a new OFFER is published and the toggle is on, create and
 * send a campaign announcing it to all subscribers. Never throws.
 */
export async function maybeAnnounceOffer(offer: {
  title: string;
  excerpt: string;
  slug: string;
  priceLabel?: string | null;
}): Promise<void> {
  try {
    const cfg = await getEmailConfig();
    if (!cfg.enabled || !cfg.events.promoOnNewOffer) return;

    const campaign = await prisma.campaign.create({
      data: {
        subject: `New offer: ${offer.title}`,
        heading: offer.title,
        body: [offer.excerpt, offer.priceLabel ? `Offer: ${offer.priceLabel}` : '']
          .filter(Boolean)
          .join('\n\n'),
        ctaLabel: 'View the offer',
        ctaHref: `${env.publicUrl}/offers`,
        trigger: 'auto:offer',
      },
    });
    await sendCampaign(campaign);
  } catch (e) {
    console.warn('[marketing] maybeAnnounceOffer failed', e);
  }
}

/** The HTML page shown when a recipient clicks the unsubscribe link. */
export function unsubscribePage(brandName: string, ok: boolean): string {
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Unsubscribe · ${brandName}</title></head>
  <body style="margin:0;font-family:Segoe UI,Helvetica,Arial,sans-serif;background:#f4f1ea;color:#23211c;">
    <div style="max-width:480px;margin:12vh auto;padding:32px;background:#fff;border:1px solid #e7e2d6;border-radius:14px;text-align:center;">
      <h1 style="color:#1f3d2b;font-size:22px;margin:0 0 12px;">${brandName}</h1>
      <p style="font-size:15px;line-height:1.6;color:#555;">${
        ok
          ? "You've been unsubscribed from our promotional emails. You'll still receive booking-related messages. Sorry to see you go!"
          : 'This unsubscribe link is invalid or has already been used.'
      }</p>
    </div>
  </body></html>`;
}
