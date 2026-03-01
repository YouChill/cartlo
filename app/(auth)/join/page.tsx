'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function JoinPage() {
  const [code, setCode] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed) {
      router.push(`/join/${trimmed}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">Cartlo</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Wpisz kod zaproszeniowy
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="code"
                  className="mb-1.5 block text-sm font-semibold text-text-primary"
                >
                  Kod zaproszeniowy
                </label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="np. abc12345"
                  required
                  className="h-11 rounded-xl border-border bg-surface text-base"
                />
              </div>

              <Button
                type="submit"
                disabled={!code.trim()}
                className="h-11 w-full rounded-xl bg-mint-400 text-[15px] font-semibold text-white shadow-sm hover:bg-mint-500 active:bg-mint-600"
              >
                Dalej
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
