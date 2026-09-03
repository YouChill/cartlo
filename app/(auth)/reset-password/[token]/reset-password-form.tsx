'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resetPassword, type ResetPasswordState } from './actions';

const initialState: ResetPasswordState = { error: null, invalidToken: false };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(
    resetPassword,
    initialState,
  );

  if (state.invalidToken) {
    return <InvalidResetLink />;
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
      <h2 className="text-lg font-bold text-text-primary">Ustaw nowe hasło</h2>
      <p className="mt-1 mb-4 text-sm text-text-secondary">
        Wpisz nowe hasło do swojego konta.
      </p>

      <form action={formAction}>
        <input type="hidden" name="token" value={token} />

        <div className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-semibold text-text-primary"
            >
              Nowe hasło
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 6 znaków"
              required
              minLength={6}
              autoComplete="new-password"
              autoFocus
              className="h-11 rounded-xl border-border bg-surface text-base focus:border-mint-400 focus:ring-mint-400/15"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-semibold text-text-primary"
            >
              Powtórz hasło
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Powtórz hasło"
              required
              minLength={6}
              autoComplete="new-password"
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
            {isPending ? 'Zapisywanie...' : 'Zapisz nowe hasło'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function InvalidResetLink() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-error-bg">
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
            className="text-error-text"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-text-primary">
          Nieprawidłowy link
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Ten link do resetowania hasła wygasł lub został już użyty.
        </p>
      </div>
      <Button
        asChild
        className="mt-6 h-11 w-full rounded-xl bg-mint-400 text-[15px] font-semibold text-white shadow-sm hover:bg-mint-500 active:bg-mint-600"
      >
        <Link href="/forgot-password">Poproś o nowy link</Link>
      </Button>
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
