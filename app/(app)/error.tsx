'use client';

import { Button } from '@/components/ui/button';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-bg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-error-text"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-text-primary">Cos poszlo nie tak</h2>
      <p className="mt-1 mb-4 text-sm text-text-secondary">
        Wystapil nieoczekiwany blad. Sprobuj ponownie.
      </p>
      <Button
        onClick={reset}
        className="h-11 rounded-xl bg-mint-400 px-6 text-[15px] font-semibold text-white shadow-sm hover:bg-mint-500 active:bg-mint-600"
      >
        Sprobuj ponownie
      </Button>
    </div>
  );
}
