'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { requestPasswordReset, type ForgotPasswordState } from './actions';

const initialState: ForgotPasswordState = { error: null, success: false };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  if (state.success) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-mint-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-mint-500"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-text-primary">
            Sprawdź skrzynkę
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Jeśli konto o podanym adresie istnieje, wysłaliśmy na nie link do
            ustawienia nowego hasła. Link jest ważny przez 1 godzinę.
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="mt-6 h-11 w-full rounded-xl text-[15px] font-semibold"
        >
          <Link href="/login">Wróć do logowania</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
      <h2 className="text-lg font-bold text-text-primary">
        Nie pamiętasz hasła?
      </h2>
      <p className="mt-1 mb-4 text-sm text-text-secondary">
        Podaj adres email, a wyślemy Ci link do ustawienia nowego hasła.
      </p>

      <form action={formAction}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-semibold text-text-primary"
            >
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="twój@email.pl"
              required
              autoComplete="email"
              autoFocus
              className="h-11 rounded-xl border-border bg-surface text-base focus:border-mint-400 focus:ring-mint-400/15"
            />
          </div>

          {state.error && (
            <div className="rounded-lg bg-error-bg px-3 py-2 text-sm text-error-text">
              {state.error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="h-11 w-full rounded-xl bg-mint-400 text-[15px] font-semibold text-white shadow-sm hover:bg-mint-500 active:bg-mint-600"
          >
            {isPending ? 'Wysyłanie...' : 'Wyślij link'}
          </Button>
        </div>
      </form>

      <div className="mt-4 text-center text-sm text-text-secondary">
        <Link
          href="/login"
          className="font-semibold text-mint-500 hover:text-mint-600"
        >
          Wróć do logowania
        </Link>
      </div>
    </div>
  );
}
