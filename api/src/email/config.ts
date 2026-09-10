import { prisma } from '../prisma.js';

/**
 * Email configuration, stored as a single JSON blob in SiteSetting under the
 * key `email`. The credential (`apiKey` — a Brevo API key, or the SMTP
 * password) lives ONLY here on the server and is never returned to the browser.
 */
export type EmailProvider = 'brevo' | 'smtp';

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
  promoOnNewOffer: boolean; // auto-email subscribers when a new offer is published
}

export interface EmailConfig {
  enabled: boolean;
  provider: EmailProvider;
  apiKey: string; // Brevo API key OR SMTP password (secret)
  fromName: string;
  fromEmail: string;
  replyTo: string;
  staffRecipients: string[];
  // SMTP-only fields (ignored when provider = brevo)
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpSecure: boolean;
  events: EmailEvents;
}

const DEFAULT_EVENTS: EmailEvents = {
  enquiryAck: true,
  bookingReceived: true,
  bookingConfirmed: true,
  bookingCancelled: true,
  checkInReminder: true,
  reviewRequest: true,
  staffNewBooking: true,
  staffNewEnquiry: true,
  staffNewReview: true,
  promoOnNewOffer: false,
};

const DEFAULT_CONFIG: EmailConfig = {
  enabled: process.env.EMAIL_ENABLED === 'true',
  provider: (process.env.EMAIL_PROVIDER as EmailProvider) || 'smtp',
  apiKey: process.env.EMAIL_API_KEY || process.env.BREVO_API_KEY || process.env.SMTP_PASS || '',
  fromName: process.env.EMAIL_FROM_NAME || 'Shraddha Garden Resort',
  fromEmail: process.env.EMAIL_FROM || process.env.SMTP_USER || '',
  replyTo: process.env.EMAIL_REPLY_TO || '',
  staffRecipients: process.env.STAFF_EMAILS
    ? process.env.STAFF_EMAILS.split(',').map((s) => s.trim()).filter(Boolean)
    : [],
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  smtpUser: process.env.SMTP_USER || '',
  smtpSecure: process.env.SMTP_SECURE === 'true',
  events: DEFAULT_EVENTS,
};

export async function getEmailConfig(): Promise<EmailConfig> {
  const row = await prisma.siteSetting.findUnique({ where: { key: 'email' } });
  if (!row) return DEFAULT_CONFIG;
  try {
    const parsed = JSON.parse(row.value) as Partial<EmailConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      events: { ...DEFAULT_EVENTS, ...(parsed.events ?? {}) },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveEmailConfig(patch: Partial<EmailConfig>): Promise<EmailConfig> {
  const current = await getEmailConfig();
  const next: EmailConfig = {
    ...current,
    ...patch,
    events: { ...current.events, ...(patch.events ?? {}) },
  };
  await prisma.siteSetting.upsert({
    where: { key: 'email' },
    create: { key: 'email', value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return next;
}

/** Admin view: masks the secret to a boolean so the UI shows "set / not set". */
export function adminEmailConfig(c: EmailConfig) {
  return {
    enabled: c.enabled,
    provider: c.provider,
    apiKeySet: Boolean(c.apiKey),
    fromName: c.fromName,
    fromEmail: c.fromEmail,
    replyTo: c.replyTo,
    staffRecipients: c.staffRecipients,
    smtpHost: c.smtpHost,
    smtpPort: c.smtpPort,
    smtpUser: c.smtpUser,
    smtpSecure: c.smtpSecure,
    events: c.events,
  };
}
