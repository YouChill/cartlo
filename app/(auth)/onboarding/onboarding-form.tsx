'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createFamily, type OnboardingFormState } from './actions';

const initialState: OnboardingFormState = {
  error: null,
  inviteCode: null,
  familyName: null,
};

type Step = 'choice' | 'create' | 'success';

export function OnboardingForm() {
  const [step, setStep] = useState<Step>('choice');
  const [state, formAction, isPending] = useActionState(
    createFamily,
    initialState,
  );

  // After successful creation, show success screen
  if (state.inviteCode && step !== 'success') {
    setStep('success');
  }

  if (step === 'success' && state.inviteCode) {
    return (
      <SuccessScreen
        inviteCode={state.inviteCode}
        familyName={state.familyName!}
      />
    );
  }

  if (step === 'create') {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
        <h2 className="mb-4 text-lg font-bold text-text-primary">
          Utworz nowa rodzine
        </h2>
        <form action={formAction}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="familyName"
                className="mb-1.5 block text-sm font-semibold text-text-primary"
              >
                Nazwa rodziny
              </label>
              <Input
                id="familyName"
                name="familyName"
                type="text"
                placeholder="np. Kowalscy"
                required
                className="h-11 rounded-xl border-border bg-surface text-base"
              />
            </div>

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
              {isPending ? 'Tworzenie...' : 'Utworz rodzine'}
            </Button>

            <button
              type="button"
              onClick={() => setStep('choice')}
              className="w-full text-center text-sm text-text-secondary hover:text-text-primary"
            >
              Wstecz
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Choice step (default)
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
      <div className="space-y-3">
        <Button
          onClick={() => setStep('create')}
          className="h-12 w-full rounded-xl bg-mint-400 text-[15px] font-semibold text-white shadow-sm hover:bg-mint-500 active:bg-mint-600"
        >
          Utworz nowa rodzine
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-12 w-full rounded-xl border-border text-[15px] font-semibold"
        >
          <Link href="/join">Mam kod zaproszeniowy</Link>
        </Button>
      </div>
    </div>
  );
}

function SuccessScreen({
  inviteCode,
  familyName,
}: {
  inviteCode: string;
  familyName: string;
}) {
  const [copied, setCopied] = useState(false);

  const inviteLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${inviteCode}`
      : `/join/${inviteCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  };

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
          Rodzina &ldquo;{familyName}&rdquo; utworzona!
        </h2>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-sm text-text-secondary">
          Udostepnij ten link, aby zaprosic bliskich:
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-raised p-3">
          <span className="flex-1 truncate text-sm text-text-primary">
            {inviteLink}
          </span>
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="shrink-0 rounded-lg text-xs"
          >
            {copied ? 'Skopiowano!' : 'Kopiuj'}
          </Button>
        </div>
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
