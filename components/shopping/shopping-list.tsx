'use client';

import { ShoppingCart } from 'lucide-react';
import { CategoryHeader } from './category-header';
import { ShoppingItem } from './shopping-item';

type ShoppingItemData = {
  id: string;
  product_name: string;
  category_id: string | null;
  is_checked: boolean;
  added_by: string;
  checked_by: string | null;
  checked_at: string | null;
  created_at: string;
};

type Category = {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
};

type GroupedItems = {
  category: Category | null;
  items: ShoppingItemData[];
};

export function ShoppingList({
  items,
  categories,
  memberNames,
}: {
  items: ShoppingItemData[];
  categories: Category[];
  memberNames: Record<string, string>;
}) {
  // Filter only unchecked items
  const activeItems = items.filter((item) => !item.is_checked);

  if (activeItems.length === 0) {
    return <EmptyState />;
  }

  // Group items by category
  const grouped = groupByCategory(activeItems, categories);

  return (
    <div className="pb-4">
      {grouped.map((group) => {
        const isUncategorized = group.category === null;
        const categoryName = isUncategorized
          ? 'Do sklasyfikowania'
          : group.category!.name;
        const categoryIcon = isUncategorized
          ? 'CircleHelp'
          : group.category!.icon;

        return (
          <div key={isUncategorized ? 'uncategorized' : group.category!.id}>
            <CategoryHeader
              name={categoryName}
              icon={categoryIcon}
              count={group.items.length}
              isUncategorized={isUncategorized}
            />
            <div className="mx-4 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              {group.items.map((item) => (
                <ShoppingItem
                  key={item.id}
                  id={item.id}
                  productName={item.product_name}
                  isChecked={item.is_checked}
                  addedBy={item.added_by}
                  checkedBy={item.checked_by}
                  checkedAt={item.checked_at}
                  createdAt={item.created_at}
                  memberNames={memberNames}
                  isUncategorized={isUncategorized}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-raised">
        <ShoppingCart size={32} className="text-text-tertiary" />
      </div>
      <h2 className="text-lg font-bold text-text-primary">Lista jest pusta</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Dodaj pierwszy produkt!
      </p>
    </div>
  );
}

function groupByCategory(
  items: ShoppingItemData[],
  categories: Category[],
): GroupedItems[] {
  const categoryMap = new Map<string, Category>();
  categories.forEach((cat) => categoryMap.set(cat.id, cat));

  const groups = new Map<string | null, ShoppingItemData[]>();

  items.forEach((item) => {
    const key = item.category_id;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  });

  const result: GroupedItems[] = [];

  // Uncategorized first
  const uncategorized = groups.get(null);
  if (uncategorized) {
    result.push({ category: null, items: uncategorized });
  }

  // Sorted categories
  const sortedCategoryIds = Array.from(groups.keys())
    .filter((k) => k !== null)
    .sort((a, b) => {
      const catA = categoryMap.get(a!);
      const catB = categoryMap.get(b!);
      return (catA?.sort_order ?? 99) - (catB?.sort_order ?? 99);
    });

  sortedCategoryIds.forEach((catId) => {
    const cat = categoryMap.get(catId!);
    if (cat) {
      result.push({ category: cat, items: groups.get(catId)! });
    }
  });

  return result;
}
