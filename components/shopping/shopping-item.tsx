'use client';

import { useOptimistic, useTransition } from 'react';
import { Check } from 'lucide-react';
import { toggleShoppingItem, classifyProduct } from '@/app/(app)/actions';
import { CategoryPicker } from './category-picker';

type CategoryData = {
  id: string;
  name: string;
  icon: string;
};

type ShoppingItemProps = {
  id: string;
  productName: string;
  isChecked: boolean;
  addedBy: string;
  checkedBy: string | null;
  createdAt: string;
  checkedAt: string | null;
  memberNames: Record<string, string>;
  isUncategorized?: boolean;
  categories?: CategoryData[];
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMinutes < 1) return 'teraz';
  if (diffMinutes < 60) return `${diffMinutes}min temu`;
  if (diffHours < 24) return `${diffHours}h temu`;

  return date.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ShoppingItem({
  id,
  productName,
  isChecked,
  addedBy,
  checkedBy,
  createdAt,
  checkedAt,
  memberNames,
  isUncategorized,
  categories,
}: ShoppingItemProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticChecked, setOptimisticChecked] = useOptimistic(isChecked);

  const handleToggle = () => {
    const newChecked = !optimisticChecked;
    startTransition(async () => {
      setOptimisticChecked(newChecked);
      await toggleShoppingItem(id, newChecked);
    });
  };

  const handleClassify = (categoryId: string) => {
    startTransition(async () => {
      await classifyProduct(id, productName, categoryId);
    });
  };

  // Display meta info: who added/checked and when
  const metaPerson = optimisticChecked
    ? (checkedBy && memberNames[checkedBy]) || memberNames[addedBy] || ''
    : memberNames[addedBy] || '';
  const metaTime =
    optimisticChecked && checkedAt
      ? formatRelativeTime(checkedAt)
      : formatRelativeTime(createdAt);
  const metaInfo = metaPerson ? `${metaPerson}, ${metaTime}` : metaTime;

  return (
    <div
      className={`border-b border-border-light last:border-b-0 ${
        isUncategorized ? 'border-l-[3px] border-l-warning-text' : ''
      } ${isPending ? 'opacity-70' : ''}`}
    >
      {/* Main row */}
      <div
        role="checkbox"
        aria-checked={optimisticChecked}
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleToggle();
          }
        }}
        className="flex min-h-[52px] cursor-pointer select-none items-center gap-3 px-4 py-3.5"
      >
        {/* Checkbox */}
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
            optimisticChecked
              ? 'animate-checkbox-bounce border-mint-400 bg-mint-300'
              : 'border-border bg-transparent'
          }`}
        >
          {optimisticChecked && (
            <Check
              size={14}
              className="animate-check-icon text-white"
              strokeWidth={3}
            />
          )}
        </div>

        {/* Product name */}
        <span
          className={`flex-1 text-base transition-all duration-150 ${
            optimisticChecked
              ? 'text-text-disabled line-through'
              : 'text-text-primary'
          }`}
        >
          {productName}
        </span>

        {/* Meta info */}
        <span className="shrink-0 text-xs text-text-tertiary">{metaInfo}</span>
      </div>

      {/* Category picker for uncategorized items */}
      {isUncategorized && categories && categories.length > 0 && (
        <div className="pb-3 pl-[52px] pr-4">
          <CategoryPicker categories={categories} onSelect={handleClassify} />
        </div>
      )}
    </div>
  );
}
