'use client';

import { useState, useTransition } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getCategoryIcon } from '@/lib/category-icons';
import {
  searchProductsForSettings,
  updateProductCategory,
  type ProductWithCategory,
} from '@/app/(app)/settings/actions';

type CategoryData = {
  id: string;
  name: string;
  icon: string;
};

export function ProductCategories({
  categories,
}: {
  categories: CategoryData[];
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductWithCategory[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, startSearch] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSearch = () => {
    if (!query.trim()) return;
    startSearch(async () => {
      const products = await searchProductsForSettings(query);
      setResults(products);
      setHasSearched(true);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleCategoryChange = (productId: string, categoryId: string) => {
    startTransition(async () => {
      const result = await updateProductCategory(productId, categoryId);
      if (result.success) {
        setResults((prev) =>
          prev.map((p) => {
            if (p.id !== productId) return p;
            const cat = categories.find((c) => c.id === categoryId);
            return {
              ...p,
              categoryId,
              categoryName: cat?.name ?? null,
              categoryIcon: cat?.icon ?? null,
            };
          }),
        );
      }
      setEditingId(null);
    });
  };

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold text-text-primary">Produkty</h2>
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <p className="mb-3 text-xs text-text-tertiary">
          Wyszukaj produkt i zmien jego kategorie. Zmiana dotyczy takze produktow na liscie zakupow.
        </p>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="np. makaron, olej..."
              className="h-11 rounded-xl border-border bg-surface pl-9 text-base"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="h-11 shrink-0 rounded-xl bg-mint-400 px-4 text-sm font-semibold text-white shadow-sm hover:bg-mint-500 active:bg-mint-600 disabled:opacity-50"
          >
            {isSearching ? 'Szukam...' : 'Szukaj'}
          </button>
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="mt-4">
            {results.length === 0 ? (
              <p className="py-4 text-center text-sm text-text-tertiary">
                Nie znaleziono produktow.
              </p>
            ) : (
              <ul className="divide-y divide-border-light">
                {results.map((product) => {
                  const isEditing = editingId === product.id;
                  const CatIcon = product.categoryIcon
                    ? getCategoryIcon(product.categoryIcon)
                    : null;

                  return (
                    <li key={product.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-text-primary">
                          {product.name}
                        </span>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingId(isEditing ? null : product.id)
                            }
                            disabled={isPending}
                            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-raised"
                          >
                            {CatIcon && (
                              <CatIcon
                                size={14}
                                className="shrink-0 text-text-tertiary"
                              />
                            )}
                            <span className="max-w-[120px] truncate">
                              {product.categoryName ?? 'Brak kategorii'}
                            </span>
                            <ChevronDown
                              size={12}
                              className={`transition-transform duration-200 ${isEditing ? 'rotate-180' : ''}`}
                            />
                          </button>

                          {isEditing && (
                            <div className="absolute right-0 z-30 mt-1 max-h-[280px] w-56 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
                              {categories.map((cat, index) => {
                                const Icon = getCategoryIcon(cat.icon);
                                const isSelected =
                                  cat.id === product.categoryId;
                                return (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() =>
                                      handleCategoryChange(product.id, cat.id)
                                    }
                                    disabled={isPending}
                                    className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-mint-50 ${
                                      index > 0
                                        ? 'border-t border-border-light'
                                        : ''
                                    } ${isSelected ? 'bg-mint-50 text-mint-600' : 'text-text-primary'}`}
                                  >
                                    <Icon
                                      size={16}
                                      className={`shrink-0 ${isSelected ? 'text-mint-500' : 'text-text-tertiary'}`}
                                    />
                                    <span className="flex-1">{cat.name}</span>
                                    {isSelected && (
                                      <Check
                                        size={14}
                                        className="shrink-0 text-mint-500"
                                      />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
