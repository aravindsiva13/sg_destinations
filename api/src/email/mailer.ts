import nodemailer from 'nodemailer';
import { getEmailConfig, type EmailConfig } from './config.js';

export interface MailInput {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export interface MailResult {
  ok: boolean;
  error?: string;
}

/** Send an email using the configured provider. Never throws. */
export async function sendMail(input: MailInput, cfgOverride?: EmailConfig): Promise<MailResult> {
  const cfg = cfgOverride ?? (await getEmailConfig());
  if (!cfg.enabled) return { ok: false, error: 'Email sending is turned off in settings.' };
  if (!cfg.fromEmail) return { ok: false, error: 'No "from" email address configured.' };
  if (!cfg.apiKey) return { ok: false, error: 'No API key / password configured.' };

  const recipients = (Array.isArray(input.to) ? input.to : [input.to]).filter(Boolean);
  if (recipients.length === 0) return { ok: false, error: 'No recipient address.' };

  try {
    if (cfg.provider === 'brevo') return await sendViaBrevo(cfg, recipients, input);
    return await sendViaSmtp(cfg, recipients, input);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown email error' };
  }
}

async function sendViaBrevo(cfg: EmailConfig, to: string[], input: MailInput): Promise<MailResult> {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': cfg.apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: cfg.fromName || 'Resort', email: cfg.fromEmail },
      to: to.map((email) => ({ email })),
      replyTo: input.replyTo || cfg.replyTo ? { email: input.replyTo || cfg.replyTo } : undefined,
      subject: input.subject,
      htmlContent: input.html,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    return { ok: false, error: `Brevo API ${res.status}: ${body.slice(0, 300)}` };
  }
  return { ok: true };
}

async function sendViaSmtp(cfg: EmailConfig, to: string[], input: MailInput): Promise<MailResult> {
  const transport = nodemailer.createTransport({
    host: cfg.smtpHost,
    port: cfg.smtpPort,
    secure: cfg.smtpSecure,
    auth: { user: cfg.smtpUser, pass: cfg.apiKey },
  });
  await transport.sendMail({
    from: `"${cfg.fromName || 'Resort'}" <${cfg.fromEmail}>`,
    to: to.join(', '),
    subject: input.subject,
    html: input.html,
    replyTo: input.replyTo || cfg.replyTo || undefined,
  });
  return { ok: true };
}
