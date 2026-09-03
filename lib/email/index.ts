/** Escape a string for safe interpolation into HTML (email templates). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** True when SMTP credentials are present and outbound email can be sent. */
export function isEmailConfigured(): boolean {
  return !!process.env.SMTP_USER && !!process.env.SMTP_PASS;
}

/** Public base URL of the app, used to build absolute links in emails. */
export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000')
  );
}

export type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * Send a transactional email over the configured SMTP transport.
 * Throws when SMTP is not configured or the transport rejects the message.
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP is not configured');
  }

  const smtpPort = Number(process.env.SMTP_PORT ?? '587');
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: smtpPort,
    // Implicit TLS on 465; STARTTLS (upgraded) on 587/others.
    secure: smtpPort === 465,
    requireTLS: smtpPort !== 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `Cartlo <${smtpUser}>`,
    ...options,
  });
}
