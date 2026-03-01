'use client';

import { useRef, useState, useTransition } from 'react';
import { Plus, Search } from 'lucide-react';
import { addProduct } from '@/app/(app)/actions';

export function AddProductInput() {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setError(null);
    startTransition(async () => {
      const result = await addProduct(trimmed);
      if (result.success) {
        setValue('');
      } else {
        setError(result.error ?? 'Wystapil blad');
      }
      // Keep focus on input for consecutive adds
      inputRef.current?.focus();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="px-4 pb-2 pt-3">
      <div
        className={`flex items-center gap-3 rounded-2xl border-[1.5px] bg-surface px-4 py-3 shadow-sm transition-colors ${
          error
            ? 'border-error-text'
            : 'border-border focus-within:border-mint-400 focus-within:shadow-[0_0_0_3px_rgba(74,222,128,0.15)]'
        }`}
      >
        <Search size={20} className="shrink-0 text-text-tertiary" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Dodaj produkt..."
          disabled={isPending}
          className="min-w-0 flex-1 bg-transparent text-base text-text-primary placeholder:text-text-tertiary focus:outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !value.trim()}
          className="shrink-0 text-mint-500 transition-opacity disabled:opacity-30"
          aria-label="Dodaj produkt"
        >
          <Plus size={24} />
        </button>
      </div>
      {error && (
        <p className="mt-1.5 px-1 text-xs text-error-text">{error}</p>
      )}
    </div>
  );
}
