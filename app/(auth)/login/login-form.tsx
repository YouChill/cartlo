'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signIn, signUp, type AuthFormState } from './actions';

const initialState: AuthFormState = { error: null };

export function LoginForm() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [signInState, signInAction, signInPending] = useActionState(
    signIn,
    initialState,
  );
  const [signUpState, signUpAction, signUpPending] = useActionState(
    signUp,
    initialState,
  );

  const isLogin = mode === 'login';
  const error = isLogin ? signInState.error : signUpState.error;
  const isPending = isLogin ? signInPending : signUpPending;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
      <form action={isLogin ? signInAction : signUpAction}>
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
              placeholder="twoj@email.pl"
              required
              autoComplete="email"
              className="h-11 rounded-xl border-border bg-surface text-base focus:border-mint-400 focus:ring-mint-400/15"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-semibold text-text-primary"
            >
              Haslo
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 6 znakow"
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
                Powtorz haslo
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Powtorz haslo"
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
                ? 'Zaloguj sie'
                : 'Zarejestruj sie'}
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
              Zarejestruj sie
            </button>
          </>
        ) : (
          <>
            Masz juz konto?{' '}
            <button
              type="button"
              onClick={() => setMode('login')}
              className="font-semibold text-mint-500 hover:text-mint-600"
            >
              Zaloguj sie
            </button>
          </>
        )}
      </div>
    </div>
  );
}
