import { findValidResetToken } from '@/lib/password-reset';
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
  const valid = await findValidResetToken(token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">Cartlo</h1>
        </div>
        {valid ? <ResetPasswordForm token={token} /> : <InvalidResetLink />}
      </div>
    </div>
  );
}
