'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { CategoryHeader } from './category-header';
import { CategoryFilters } from './category-filters';
import { AddProductInput } from './add-product-input';
import { CheckedSection } from './checked-section';
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
  const [activeFilter, setActiveFilter] = useState<string | null | 'all'>(
    'all',
  );

  // Separate active and checked items
  const activeItems = items.filter((item) => !item.is_checked);
  const checkedItems = items.filter((item) => item.is_checked);

  if (activeItems.length === 0) {
    return (
      <div className="pb-4">
        <div className="sticky top-0 z-20 bg-background/85 backdrop-blur-[12px]">
          <AddProductInput />
        </div>
        <EmptyState />
        <CheckedSection items={checkedItems} memberNames={memberNames} />
      </div>
    );
  }

  // Group all active items by category (for filter chip counts)
  const allGrouped = groupByCategory(activeItems, categories);

  // Build category chips data from groups that have items
  const categoryChips = allGrouped
    .filter((g) => g.category !== null)
    .map((g) => ({
      id: g.category!.id,
      name: g.category!.name,
      count: g.items.length,
    }));

  const uncategorizedCount =
    allGrouped.find((g) => g.category === null)?.items.length ?? 0;

  // Apply filter
  const filteredGroups =
    activeFilter === 'all'
      ? allGrouped
      : allGrouped.filter((g) => {
          if (activeFilter === null) return g.category === null;
          return g.category?.id === activeFilter;
        });

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-20 bg-background/85 backdrop-blur-[12px]">
        <AddProductInput />
        <CategoryFilters
          categories={categoryChips}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          uncategorizedCount={uncategorizedCount}
        />
      </div>

      {filteredGroups.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-text-tertiary">
          Brak pozycji w tej kategorii
        </div>
      ) : (
        filteredGroups.map((group) => {
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
                    categories={
                      isUncategorized
                        ? categories.map((c) => ({
                            id: c.id,
                            name: c.name,
                            icon: c.icon,
                          }))
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>
          );
        })
      )}

      <CheckedSection items={checkedItems} memberNames={memberNames} />
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
