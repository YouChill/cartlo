'use client';

import { useState, useTransition } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toggleShoppingItem, clearCheckedItems } from '@/app/(app)/actions';

type CheckedItem = {
  id: string;
  product_name: string;
  checked_by: string | null;
  checked_at: string | null;
};

type CheckedSectionProps = {
  items: CheckedItem[];
  memberNames: Record<string, string>;
};

export function CheckedSection({ items, memberNames }: CheckedSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) return null;

  const handleUncheck = (itemId: string) => {
    startTransition(async () => {
      await toggleShoppingItem(itemId, false);
    });
  };

  const handleClearAll = () => {
    startTransition(async () => {
      await clearCheckedItems();
      setDialogOpen(false);
    });
  };

  return (
    <div className="mx-4 mt-6 overflow-hidden rounded-2xl bg-surface-raised">
      {/* Header — toggle collapse */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <Check size={16} className="text-mint-500" />
        <span className="flex-1 text-lg font-bold text-text-primary">
          Kupione ({items.length})
        </span>
        <ChevronDown
          size={20}
          className={`text-text-tertiary transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Collapsible content */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          {/* Checked items list */}
          <div className="border-t border-border-light">
            {items.map((item) => {
              const checkerName = item.checked_by
                ? memberNames[item.checked_by]
                : null;

              return (
                <div
                  key={item.id}
                  role="checkbox"
                  aria-checked={true}
                  tabIndex={0}
                  onClick={() => handleUncheck(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      handleUncheck(item.id);
                    }
                  }}
                  className={`flex min-h-[44px] cursor-pointer select-none items-center gap-3 border-b border-border-light px-4 py-2.5 last:border-b-0 ${
                    isPending ? 'opacity-70' : ''
                  }`}
                >
                  {/* Checked checkbox */}
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-mint-400 bg-mint-300">
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>

                  {/* Product name — strikethrough + disabled */}
                  <span className="flex-1 text-base text-text-disabled line-through">
                    {item.product_name}
                  </span>

                  {/* Who checked */}
                  {checkerName && (
                    <span className="shrink-0 text-xs text-text-tertiary">
                      {checkerName}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Clear all button */}
          <div className="border-t border-border-light px-4 py-3">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="w-full text-center text-sm font-semibold text-error-text transition-opacity hover:opacity-80"
                >
                  Wyczysc kupione
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Wyczysc kupione</DialogTitle>
                  <DialogDescription>
                    Czy na pewno chcesz usunac {items.length} kupionych pozycji?
                    Tej operacji nie mozna cofnac.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Anuluj
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleClearAll}
                    disabled={isPending}
                  >
                    {isPending ? 'Usuwanie...' : 'Usun'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
