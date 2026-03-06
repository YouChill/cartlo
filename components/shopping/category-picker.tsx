'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { getCategoryIcon } from '@/lib/category-icons';

type Category = {
  id: string;
  name: string;
  icon: string;
};

type CategoryPickerProps = {
  categories: Category[];
  onSelect: (categoryId: string) => void;
};

export function CategoryPicker({ categories, onSelect }: CategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-1 rounded-full border border-warning-border bg-warning-bg px-2.5 py-1 text-xs font-semibold text-warning-text transition-colors hover:bg-warning-border/30"
      >
        Wybierz kategorie
        <ChevronDown
          size={12}
          className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-40 mt-1 max-h-[280px] w-56 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
          {categories.map((cat) => {
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
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-mint-50"
              >
                <Icon size={16} className="shrink-0 text-text-secondary" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
