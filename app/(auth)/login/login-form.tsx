'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { login, register, type AuthFormState } from './actions';

const initialState: AuthFormState = { error: null };

export function LoginForm({
  joinCode,
  passwordReset = false,
}: {
  joinCode?: string;
  passwordReset?: boolean;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginState, loginAction, loginPending] = useActionState(
    login,
    initialState,
  );
  const [registerState, registerAction, registerPending] = useActionState(
    register,
    initialState,
  );

  const isLogin = mode === 'login';
  const error = isLogin ? loginState.error : registerState.error;
  const isPending = isLogin ? loginPending : registerPending;
  const hasJoinCode = !!joinCode;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
      {passwordReset && isLogin && (
        <div className="mb-4 rounded-lg bg-mint-50 px-3 py-2 text-center text-sm text-mint-600">
          Hasło zostało zmienione. Zaloguj się nowym hasłem.
        </div>
      )}

      {hasJoinCode && (
        <div className="mb-4 rounded-lg bg-mint-50 px-3 py-2 text-center text-sm text-mint-600">
          {isLogin
            ? 'Zaloguj się, aby dołączyć do rodziny'
            : 'Zarejestruj się, aby dołączyć do rodziny'}
        </div>
      )}

      <form action={isLogin ? loginAction : registerAction}>
        {/* Pass joinCode as hidden field so server actions can use it */}
        {joinCode && <input type="hidden" name="joinCode" value={joinCode} />}

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
              className="h-11 rounded-xl border-border bg-surface text-base focus:border-mint-400 focus:ring-mint-400/15"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-text-primary"
              >
                Hasło
              </label>
              {isLogin && (
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-mint-500 hover:text-mint-600"
                >
                  Nie pamiętasz hasła?
                </Link>
              )}
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 6 znaków"
              required
              minLength={6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              className="h-11 rounded-xl border-border bg-surface text-base focus:border-mint-400 focus:ring-mint-400/15"
            />
          </div>

          {!isLogin && (
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
          )}

          {error && (
            <div className="rounded-lg bg-error-bg px-3 py-2 text-sm text-error-text">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="h-11 w-full rounded-xl bg-mint-400 text-[15px] font-semibold text-white shadow-sm hover:bg-mint-500 active:bg-mint-600"
          >
            {isPending
              ? 'Poczekaj...'
              : isLogin
                ? hasJoinCode
                  ? 'Zaloguj i dołącz'
                  : 'Zaloguj się'
                : hasJoinCode
                  ? 'Zarejestruj i dołącz'
                  : 'Zarejestruj się'}
          </Button>
        </div>
      </form>

      <div className="mt-4 text-center text-sm text-text-secondary">
        {isLogin ? (
          <>
            Nie masz konta?{' '}
            <button
              type="button"
              onClick={() => setMode('register')}
              className="font-semibold text-mint-500 hover:text-mint-600"
            >
              Zarejestruj się
            </button>
          </>
        ) : (
          <>
            Masz już konto?{' '}
            <button
              type="button"
              onClick={() => setMode('login')}
              className="font-semibold text-mint-500 hover:text-mint-600"
            >
              Zaloguj się
            </button>
          </>
        )}
      </div>
    </div>
  );
}
