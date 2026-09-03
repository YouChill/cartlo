'use server';

import { eq } from 'drizzle-orm';
import { isReservedEmailDomain } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import {
  escapeHtml,
  getAppBaseUrl,
  isEmailConfigured,
  sendEmail,
} from '@/lib/email';
import {
  MISSING_RESET_TABLE_MESSAGE,
  createPasswordResetToken,
  isMissingResetTableError,
} from '@/lib/password-reset';

export type ForgotPasswordState = {
  error: string | null;
  success: boolean;
};

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase();

  if (!email) {
    return { error: 'Podaj adres email.', success: false };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: 'Podaj poprawny adres email.', success: false };
  }

  if (!isEmailConfigured()) {
    return {
      error:
        'Wysyłanie emaili nie jest skonfigurowane. Skontaktuj się z administratorem.',
      success: false,
    };
  }

  // From here on every path returns the same success response, so the form
  // never reveals whether an account exists for the given address.
  if (isReservedEmailDomain(email)) {
    return { error: null, success: true };
  }

  const [user] = await db
    .select({ id: users.id, loginDisabled: users.loginDisabled })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || user.loginDisabled) {
    return { error: null, success: true };
  }

  let token: string | null;
  try {
    token = await createPasswordResetToken(user.id);
  } catch (err) {
    console.error('Password reset token error:', err);
    return {
      error: isMissingResetTableError(err)
        ? MISSING_RESET_TABLE_MESSAGE
        : 'Wystąpił błąd. Spróbuj ponownie za chwilę.',
      success: false,
    };
  }
  if (!token) {
    // Cooldown — an email went out moments ago; don't spam the inbox.
    return { error: null, success: true };
  }

  const resetLink = `${getAppBaseUrl()}/reset-password/${token}`;
  const safeLink = escapeHtml(resetLink);

  try {
    await sendEmail({
      to: email,
      subject: 'Resetowanie hasła w Cartlo',
      text:
        'Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w Cartlo.\n\n' +
        `Aby ustawić nowe hasło, otwórz ten link (ważny przez 1 godzinę):\n${resetLink}\n\n` +
        'Jeśli to nie Ty, zignoruj tę wiadomość — Twoje hasło pozostanie bez zmian.\n',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
          <h2 style="color: #1a1a1a; margin-bottom: 8px;">Resetowanie hasła</h2>
          <p style="color: #6b6b6b; font-size: 15px; line-height: 1.6;">
            Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w <strong>Cartlo</strong>.
            Kliknij przycisk poniżej, aby ustawić nowe hasło. Link jest ważny przez 1 godzinę.
          </p>
          <a href="${safeLink}"
             style="display: inline-block; margin-top: 16px; padding: 12px 24px;
                    background: #4ade80; color: #fff; font-weight: 600;
                    text-decoration: none; border-radius: 12px; font-size: 15px;">
            Ustaw nowe hasło
          </a>
          <p style="margin-top: 24px; color: #9b9b9b; font-size: 13px;">
            Lub skopiuj link: <br/>
            <a href="${safeLink}" style="color: #4ade80;">${safeLink}</a>
          </p>
          <p style="margin-top: 24px; color: #9b9b9b; font-size: 13px;">
            Jeśli to nie Ty prosiłeś o reset, zignoruj tę wiadomość — Twoje hasło pozostanie bez zmian.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Password reset email error:', err);
    return {
      error: 'Wystąpił błąd podczas wysyłania. Spróbuj ponownie.',
      success: false,
    };
  }

  return { error: null, success: true };
}
