import { escapeHtml, getAppBaseUrl, isEmailConfigured, sendEmail } from '.';

/**
 * Notify the account owner that their password was just changed. Sent after
 * both a reset-by-link and a change from Settings. Never throws — a failed
 * notification must not roll back an otherwise successful password change.
 */
export async function sendPasswordChangedEmail(to: string): Promise<void> {
  if (!isEmailConfigured()) return;

  const forgotLink = `${getAppBaseUrl()}/forgot-password`;
  const safeForgotLink = escapeHtml(forgotLink);
  const when = new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Warsaw',
  }).format(new Date());

  try {
    await sendEmail({
      to,
      subject: 'Twoje hasło w Cartlo zostało zmienione',
      text:
        `Hasło do Twojego konta w Cartlo zostało zmienione (${when}).\n\n` +
        'Jeśli to Ty — nic więcej nie musisz robić.\n\n' +
        'Jeśli to nie Ty, natychmiast ustaw nowe hasło korzystając z linku ' +
        `„Nie pamiętasz hasła?”:\n${forgotLink}\n`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
          <h2 style="color: #1a1a1a; margin-bottom: 8px;">Hasło zostało zmienione</h2>
          <p style="color: #6b6b6b; font-size: 15px; line-height: 1.6;">
            Hasło do Twojego konta w <strong>Cartlo</strong> zostało zmienione
            (${escapeHtml(when)}). Jeśli to Ty — nic więcej nie musisz robić.
          </p>
          <p style="color: #6b6b6b; font-size: 15px; line-height: 1.6;">
            Jeśli to nie Ty, natychmiast ustaw nowe hasło:
          </p>
          <a href="${safeForgotLink}"
             style="display: inline-block; margin-top: 8px; padding: 12px 24px;
                    background: #4ade80; color: #fff; font-weight: 600;
                    text-decoration: none; border-radius: 12px; font-size: 15px;">
            Ustaw nowe hasło
          </a>
          <p style="margin-top: 24px; color: #9b9b9b; font-size: 13px;">
            Lub skopiuj link: <br/>
            <a href="${safeForgotLink}" style="color: #4ade80;">${safeForgotLink}</a>
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Password changed email error:', err);
  }
}
