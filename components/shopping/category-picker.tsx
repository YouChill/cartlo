'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getCategoryIcon } from '@/lib/category-icons';

type CategoryData = {
  id: string;
  name: string;
  icon: string;
};

export function CategoryPicker({
  categories,
  onSelect,
}: {
  categories: CategoryData[];
  onSelect: (categoryId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1.5 rounded-lg border border-warning-border bg-warning-bg px-2.5 py-1.5 text-xs font-semibold text-warning-text transition-colors hover:bg-warning-border/40"
      >
        Wybierz kategorie
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 z-30 mt-1 max-h-[280px] w-56 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
          {categories.map((cat, index) => {
            const Icon = getCategoryIcon(cat.icon);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(cat.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-text-primary hover:bg-mint-50 ${
                  index > 0 ? 'border-t border-border-light' : ''
                }`}
              >
                <Icon size={16} className="shrink-0 text-text-tertiary" />
                {cat.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
