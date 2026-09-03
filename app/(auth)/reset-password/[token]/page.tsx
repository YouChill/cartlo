import {
  SCHEMA_OUT_OF_DATE_MESSAGE,
  findValidResetToken,
  isSchemaOutOfDateError,
} from '@/lib/password-reset';
import { InvalidResetLink, ResetPasswordForm } from './reset-password-form';

export const metadata = {
  title: 'Nowe hasło — Cartlo',
};

type Props = {
  params: Promise<{ token: string }>;
};

export default async function ResetPasswordPage({ params }: Props) {
  const { token } = await params;

  // Validate the link before rendering the form so an expired or used token
  // gets an explanation up front instead of after typing a new password.
  let valid: Awaited<ReturnType<typeof findValidResetToken>> = null;
  let setupError: string | null = null;
  try {
    valid = await findValidResetToken(token);
  } catch (err) {
    console.error('Password reset lookup error:', err);
    setupError = isSchemaOutOfDateError(err)
      ? SCHEMA_OUT_OF_DATE_MESSAGE
      : 'Wystąpił błąd. Spróbuj ponownie za chwilę.';
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">Cartlo</h1>
        </div>
        {setupError ? (
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
            <div className="rounded-lg bg-error-bg px-3 py-2 text-sm text-error-text">
              {setupError}
            </div>
          </div>
        ) : valid ? (
          <ResetPasswordForm token={token} />
        ) : (
          <InvalidResetLink />
        )}
      </div>
    </div>
  );
}
