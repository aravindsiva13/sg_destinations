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
  if (!cfg.enabled) {
    console.warn('[email] Skipping email: Sending is toggled OFF in Email Settings.');
    return { ok: false, error: 'Email sending is turned off in settings.' };
  }
  if (!cfg.fromEmail) {
    console.warn('[email] Skipping email: No "from" email address configured.');
    return { ok: false, error: 'No "from" email address configured.' };
  }
  if (!cfg.apiKey) {
    console.warn('[email] Skipping email: No API key or SMTP password configured.');
    return { ok: false, error: 'No API key / password configured.' };
  }

  const recipients = (Array.isArray(input.to) ? input.to : [input.to]).filter(Boolean);
  if (recipients.length === 0) {
    console.warn('[email] Skipping email: No recipient address.');
    return { ok: false, error: 'No recipient address.' };
  }

  console.log(`[email] Sending email via ${cfg.provider.toUpperCase()} to ${recipients.join(', ')} | Subject: "${input.subject}"`);

  try {
    let result: MailResult;
    if (cfg.provider === 'brevo') {
      result = await sendViaBrevo(cfg, recipients, input);
    } else {
      result = await sendViaSmtp(cfg, recipients, input);
    }

    if (result.ok) {
      console.log(`[email] Successfully delivered to ${recipients.join(', ')}`);
    } else {
      console.error(`[email] Delivery failed to ${recipients.join(', ')}: ${result.error}`);
    }
    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown email error';
    console.error(`[email] Exception sending to ${recipients.join(', ')}: ${errorMsg}`);
    return { ok: false, error: errorMsg };
  }
}

async function sendViaBrevo(cfg: EmailConfig, to: string[], input: MailInput): Promise<MailResult> {
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': cfg.apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: cfg.fromName || 'Shraddha Garden Resort', email: cfg.fromEmail },
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
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network failure connecting to Brevo API' };
  }
}

async function sendViaSmtp(cfg: EmailConfig, to: string[], input: MailInput): Promise<MailResult> {
  const port = Number(cfg.smtpPort) || 587;
  const isSecure = cfg.smtpSecure ?? (port === 465);

  const transport = nodemailer.createTransport({
    host: cfg.smtpHost || 'smtp.gmail.com',
    port,
    secure: isSecure,
    auth: { user: cfg.smtpUser || cfg.fromEmail, pass: cfg.apiKey },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    await transport.sendMail({
      from: `"${cfg.fromName || 'Shraddha Garden Resort'}" <${cfg.fromEmail}>`,
      to: to.join(', '),
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo || cfg.replyTo || undefined,
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `SMTP error (${cfg.smtpHost}:${port}): ${msg}` };
  }
}
