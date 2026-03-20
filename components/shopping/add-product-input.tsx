'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Minus, Plus, Search } from 'lucide-react';
import {
  addProduct,
  searchProducts,
  type ProductSuggestion,
} from '@/app/(app)/actions';
import { getCategoryIcon } from '@/lib/category-icons';

const AVAILABLE_UNITS = ['szt', 'g', 'kg', 'ml', 'l'] as const;
type Unit = (typeof AVAILABLE_UNITS)[number];

export function AddProductInput() {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<Unit>('szt');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Debounced search
  const searchDebounced = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setShowDropdown(false);
      setSelectedIndex(-1);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const results = await searchProducts(trimmed);
      setSuggestions(results);
      setShowDropdown(true);
      setSelectedIndex(-1);
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.parentElement?.parentElement?.contains(
          e.target as Node,
        )
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddProduct = (name: string, categoryId?: string | null) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setError(null);
    setShowDropdown(false);
    setSuggestions([]);
    startTransition(async () => {
      const result = await addProduct(trimmed, categoryId, quantity, unit);
      if (result.success) {
        setValue('');
        setQuantity(1);
        setUnit('szt');
      } else {
        setError(result.error ?? 'Wystapil blad');
      }
      inputRef.current?.focus();
    });
  };

  const handleSubmit = () => {
    // If a suggestion is selected, use it
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      const suggestion = suggestions[selectedIndex];
      handleAddProduct(suggestion.name, suggestion.category_id);
      return;
    }
    // If selectedIndex points to "add as new" option
    if (selectedIndex === suggestions.length && value.trim()) {
      handleAddProduct(value.trim(), null);
      return;
    }
    // Default: add typed value (will auto-categorize via server action)
    handleAddProduct(value);
  };

  const handleQuantityChange = (delta: number) => {
    const step = unit === 'g' || unit === 'ml' ? 50 : 1;
    const adjusted =
      unit === 'g' || unit === 'ml'
        ? Math.max(step, quantity + delta * step)
        : Math.max(1, quantity + delta);
    setQuantity(adjusted);
  };

  const handleUnitChange = (newUnit: Unit) => {
    setUnit(newUnit);
    // Reset quantity to sensible default when switching unit type
    if ((newUnit === 'g' || newUnit === 'ml') && quantity < 50) {
      setQuantity(50);
    } else if (newUnit !== 'g' && newUnit !== 'ml' && quantity >= 50 && unit === 'g' || unit === 'ml') {
      setQuantity(1);
    }
  };

  const formatQuantity = (qty: number) =>
    qty % 1 === 0 ? qty.toFixed(0) : qty.toString();

  // Check if typed value exactly matches any suggestion
  const exactMatch = suggestions.some(
    (s) => s.name.toLowerCase() === value.trim().toLowerCase(),
  );

  // Total items in dropdown: suggestions + "add as new" (if no exact match)
  const showAddNew = value.trim() && !exactMatch;
  const totalItems = suggestions.length + (showAddNew ? 1 : 0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSelectedIndex(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showDropdown && totalItems > 0) {
        setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showDropdown && totalItems > 0) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (error) setError(null);
    searchDebounced(newValue);
  };

  return (
    <div className="relative px-4 pb-2 pt-3">
      <div
        className={`rounded-2xl border-[1.5px] bg-surface shadow-sm transition-colors ${
          error
            ? 'border-error-text'
            : 'border-border focus-within:border-mint-400 focus-within:shadow-[0_0_0_3px_rgba(74,222,128,0.15)]'
        }`}
      >
        {/* Search row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Search size={20} className="shrink-0 text-text-tertiary" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (value.trim() && suggestions.length > 0) {
                setShowDropdown(true);
              }
            }}
            placeholder="Dodaj produkt..."
            disabled={isPending}
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
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

        {/* Quantity + unit row */}
        <div className="flex items-center gap-2 border-t border-border-light px-4 py-2">
          {/* Quantity controls */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-1 py-0.5">
            <button
              type="button"
              onClick={() => handleQuantityChange(-1)}
              disabled={
                isPending ||
                (unit === 'g' || unit === 'ml' ? quantity <= 50 : quantity <= 1)
              }
              className="flex h-6 w-6 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-mint-50 hover:text-mint-600 disabled:opacity-30"
              aria-label="Zmniejsz ilosc"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-[2.5rem] text-center text-sm font-semibold text-text-primary">
              {formatQuantity(quantity)}
            </span>
            <button
              type="button"
              onClick={() => handleQuantityChange(1)}
              disabled={isPending}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-mint-50 hover:text-mint-600 disabled:opacity-30"
              aria-label="Zwieksz ilosc"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Unit selector */}
          <div className="flex items-center gap-0.5 rounded-xl border border-border bg-background px-1 py-0.5">
            {AVAILABLE_UNITS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => {
                  if (u !== unit) handleUnitChange(u);
                }}
                disabled={isPending}
                className={`rounded-lg px-2 py-0.5 text-xs font-medium transition-colors ${
                  u === unit
                    ? 'bg-mint-500 text-white'
                    : 'text-text-tertiary hover:bg-mint-50 hover:text-mint-600'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-1.5 px-1 text-xs text-error-text">{error}</p>
      )}

      {/* Autocomplete dropdown */}
      {showDropdown && totalItems > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-4 right-4 z-30 mt-1 max-h-[360px] origin-top animate-slide-down overflow-y-auto overflow-x-hidden rounded-2xl border border-border bg-surface shadow-lg"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => {
            const Icon = suggestion.category_icon
              ? getCategoryIcon(suggestion.category_icon)
              : null;

            return (
              <div
                key={suggestion.id}
                role="option"
                aria-selected={selectedIndex === index}
                onClick={() =>
                  handleAddProduct(suggestion.name, suggestion.category_id)
                }
                className={`flex cursor-pointer items-center gap-3 px-4 py-3 ${
                  selectedIndex === index ? 'bg-mint-50' : 'hover:bg-mint-50'
                } ${index > 0 ? 'border-t border-border-light' : ''}`}
              >
                <span className="flex-1 text-base text-text-primary">
                  {suggestion.name}
                </span>
                {suggestion.category_name && (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-text-tertiary">
                    {Icon && <Icon size={12} />}
                    {suggestion.category_name}
                  </span>
                )}
              </div>
            );
          })}

          {/* "Add as new" option */}
          {showAddNew && (
            <div
              role="option"
              aria-selected={selectedIndex === suggestions.length}
              onClick={() => handleAddProduct(value.trim(), null)}
              className={`flex cursor-pointer items-center gap-2 border-t border-border-light px-4 py-3 ${
                selectedIndex === suggestions.length
                  ? 'bg-mint-200'
                  : 'bg-mint-100 hover:bg-mint-200'
              }`}
            >
              <Plus size={16} className="shrink-0 text-mint-600" />
              <span className="text-base text-mint-600">
                Dodaj &ldquo;{value.trim()}&rdquo; jako nowy
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
