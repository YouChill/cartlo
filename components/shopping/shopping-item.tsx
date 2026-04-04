'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import { toggleShoppingItem, classifyProduct, updateQuantity } from '@/app/(app)/actions';
import { CategoryPicker } from './category-picker';

type CategoryData = {
  id: string;
  name: string;
  icon: string;
};

type ShoppingItemProps = {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
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

function getQuantityStep(unit: string): number {
  if (unit === 'kg' || unit === 'l') return 0.5;
  if (unit === 'g' || unit === 'ml') return 100;
  return 1;
}

function formatQuantity(qty: number): string {
  return qty % 1 === 0 ? qty.toFixed(0) : qty.toString();
}

export function ShoppingItem({
  id,
  productName,
  quantity,
  unit,
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
  const [isQtyPending, startQtyTransition] = useTransition();
  const [optimisticChecked, setOptimisticChecked] = useOptimistic(isChecked);
  const [optimisticQuantity, setOptimisticQuantity] = useOptimistic(quantity);
  const [classifyError, setClassifyError] = useState<string | null>(null);

  const step = getQuantityStep(unit);
  const minQuantity = step;

  const handleToggle = () => {
    const newChecked = !optimisticChecked;
    startTransition(async () => {
      setOptimisticChecked(newChecked);
      await toggleShoppingItem(id, newChecked);
    });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newQty = parseFloat((optimisticQuantity + step).toFixed(2));
    startQtyTransition(async () => {
      setOptimisticQuantity(newQty);
      await updateQuantity(id, newQty);
    });
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (optimisticQuantity <= minQuantity) return;
    const newQty = parseFloat(Math.max(minQuantity, optimisticQuantity - step).toFixed(2));
    startQtyTransition(async () => {
      setOptimisticQuantity(newQty);
      await updateQuantity(id, newQty);
    });
  };

  const handleClassify = (categoryId: string) => {
    setClassifyError(null);
    startTransition(async () => {
      try {
        const result = await classifyProduct(id, productName, categoryId);
        if (!result.success) {
          setClassifyError(result.error ?? 'Nie udało się przypisać kategorii');
        }
      } catch {
        setClassifyError('Wystąpił błąd przy przypisywaniu kategorii');
      }
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
      className={`border-b border-border-light last:border-b-0 first:rounded-t-2xl last:rounded-b-2xl ${
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

        {/* Quantity controls (hidden when checked) */}
        {!optimisticChecked ? (
          <div
            className={`flex shrink-0 items-center gap-1 ${isQtyPending ? 'opacity-60' : ''}`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleDecrement}
              disabled={optimisticQuantity <= minQuantity}
              className="flex h-7 w-7 items-center justify-center rounded-full text-mint-500 transition-colors hover:bg-mint-100 active:bg-mint-200 disabled:text-text-disabled"
              aria-label="Zmniejsz ilość"
            >
              <Minus size={13} strokeWidth={2.5} />
            </button>
            <span className="min-w-[3.5rem] text-center text-sm text-text-secondary">
              {formatQuantity(optimisticQuantity)} {unit}
            </span>
            <button
              onClick={handleIncrement}
              className="flex h-7 w-7 items-center justify-center rounded-full text-mint-500 transition-colors hover:bg-mint-100 active:bg-mint-200"
              aria-label="Zwiększ ilość"
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          /* Show quantity as plain text when checked */
          (quantity !== 1 || unit !== 'szt') && (
            <span className="shrink-0 text-sm text-text-disabled line-through">
              {formatQuantity(quantity)} {unit}
            </span>
          )
        )}

        {/* Meta info */}
        <span className="shrink-0 text-xs text-text-tertiary">{metaInfo}</span>
      </div>

      {/* Category picker for uncategorized items */}
      {isUncategorized && categories && categories.length > 0 && (
        <div className="pb-3 pl-[52px] pr-4">
          <CategoryPicker categories={categories} onSelect={handleClassify} />
          {classifyError && (
            <p className="mt-1 text-xs text-error-text">{classifyError}</p>
          )}
        </div>
      )}
    </div>
  );
}
