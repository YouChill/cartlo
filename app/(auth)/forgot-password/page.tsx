import { ForgotPasswordForm } from './forgot-password-form';

export const metadata = {
  title: 'Resetowanie hasła — Cartlo',
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">Cartlo</h1>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
