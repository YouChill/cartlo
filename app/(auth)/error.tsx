'use client';

import { useEffect } from 'react';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Auth error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-lg font-semibold text-text-primary">
        Coś poszło nie tak
      </h2>
      <p className="text-sm text-text-secondary">
        Wystąpił błąd podczas logowania. Spróbuj ponownie.
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-mint-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-mint-600"
      >
        Spróbuj ponownie
      </button>
    </div>
  );
}
