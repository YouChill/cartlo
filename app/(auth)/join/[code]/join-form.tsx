'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { joinFamily, type JoinFormState } from './actions';

const initialState: JoinFormState = {
  error: null,
  success: false,
  familyName: null,
};

export function JoinForm({
  code,
  familyName,
}: {
  code: string;
  familyName: string;
}) {
  const [state, formAction, isPending] = useActionState(
    joinFamily,
    initialState,
  );

  if (state.success && state.familyName) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
        <div className="mb-4 text-center">
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
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-text-primary">
            Dolaczyles do rodziny &ldquo;{state.familyName}&rdquo;!
          </h2>
        </div>
        <Button
          asChild
          className="h-11 w-full rounded-xl bg-mint-400 text-[15px] font-semibold text-white shadow-sm hover:bg-mint-500 active:bg-mint-600"
        >
          <Link href="/">Przejdz do listy</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
      <h2 className="mb-1 text-lg font-bold text-text-primary">
        Dolacz do rodziny
      </h2>
      <p className="mb-4 text-sm text-text-secondary">
        Dolaczasz do: <span className="font-semibold">{familyName}</span>
      </p>

      <form action={formAction}>
        <input type="hidden" name="code" value={code} />
        <div className="space-y-4">
          <div>
            <label
              htmlFor="displayName"
              className="mb-1.5 block text-sm font-semibold text-text-primary"
            >
              Twoje imie
            </label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              placeholder="np. Kasia"
              required
              className="h-11 rounded-xl border-border bg-surface text-base"
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
            {isPending ? 'Dolaczanie...' : 'Dolacz'}
          </Button>
        </div>
      </form>
    </div>
  );
}
