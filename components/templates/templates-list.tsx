'use client';

import { useState, useTransition, useCallback, useRef, useEffect } from 'react';
import {
  Plus,
  LayoutTemplate,
  Trash2,
  ChevronDown,
  X,
  Search,
  ShoppingCart,
  Pencil,
  Check,
} from 'lucide-react';
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
import {
  type TemplateData,
  type TemplateItemData,
  createTemplate,
  deleteTemplate,
  renameTemplate,
  addTemplateItem,
  removeTemplateItem,
  useTemplate,
} from '@/app/(app)/templates/actions';
import { searchProducts, type ProductSuggestion } from '@/app/(app)/actions';
import { getCategoryIcon } from '@/lib/category-icons';

type Category = {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
};

export function TemplatesList({
  initialTemplates,
  categories,
}: {
  initialTemplates: TemplateData[];
  categories: Category[];
}) {
  const [templatesList, setTemplatesList] =
    useState<TemplateData[]>(initialTemplates);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    const trimmed = newTemplateName.trim();
    if (!trimmed) {
      setCreateError('Wpisz nazwe szablonu');
      return;
    }
    startTransition(async () => {
      const result = await createTemplate(trimmed);
      if (result.success && result.id) {
        setTemplatesList((prev) => [
          ...prev,
          {
            id: result.id!,
            name: trimmed,
            created_at: new Date().toISOString(),
            items: [],
          },
        ]);
        setNewTemplateName('');
        setCreateDialogOpen(false);
        setCreateError(null);
      } else {
        setCreateError(result.error ?? 'Wystapil blad');
      }
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    startTransition(async () => {
      await deleteTemplate(templateId);
      setTemplatesList((prev) => prev.filter((t) => t.id !== templateId));
    });
  };

  const handleRenameTemplate = (templateId: string, newName: string) => {
    setTemplatesList((prev) =>
      prev.map((t) => (t.id === templateId ? { ...t, name: newName } : t)),
    );
  };

  const handleAddItem = (templateId: string, item: TemplateItemData) => {
    setTemplatesList((prev) =>
      prev.map((t) =>
        t.id === templateId ? { ...t, items: [...t.items, item] } : t,
      ),
    );
  };

  const handleRemoveItem = (templateId: string, itemId: string) => {
    setTemplatesList((prev) =>
      prev.map((t) =>
        t.id === templateId
          ? { ...t, items: t.items.filter((i) => i.id !== itemId) }
          : t,
      ),
    );
  };

  if (templatesList.length === 0) {
    return (
      <div className="pb-4">
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-raised">
            <LayoutTemplate size={32} className="text-text-tertiary" />
          </div>
          <h2 className="text-lg font-bold text-text-primary">
            Brak szablonow
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Utwórz szablon, by szybko dodawać ulubione produkty do listy.
          </p>
          <button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            className="mt-6 flex items-center gap-2 rounded-2xl bg-mint-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus size={18} />
            Nowy szablon
          </button>
        </div>

        <CreateTemplateDialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) {
              setNewTemplateName('');
              setCreateError(null);
            }
          }}
          name={newTemplateName}
          onNameChange={setNewTemplateName}
          error={createError}
          onSubmit={handleCreate}
          isPending={isPending}
        />
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Create button */}
      <div className="px-4 py-3">
        <button
          type="button"
          onClick={() => setCreateDialogOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-mint-300 bg-mint-50 py-3 text-sm font-semibold text-mint-600 transition-colors hover:bg-mint-100"
        >
          <Plus size={18} />
          Nowy szablon
        </button>
      </div>

      {/* Templates */}
      <div className="flex flex-col gap-3 px-4">
        {templatesList.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            categories={categories}
            onDelete={() => handleDeleteTemplate(template.id)}
            onRename={(newName) => handleRenameTemplate(template.id, newName)}
            onAddItem={(item) => handleAddItem(template.id, item)}
            onRemoveItem={(itemId) => handleRemoveItem(template.id, itemId)}
          />
        ))}
      </div>

      <CreateTemplateDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) {
            setNewTemplateName('');
            setCreateError(null);
          }
        }}
        name={newTemplateName}
        onNameChange={setNewTemplateName}
        error={createError}
        onSubmit={handleCreate}
        isPending={isPending}
      />
    </div>
  );
}

function CreateTemplateDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  error,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (v: string) => void;
  error: string | null;
  onSubmit: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nowy szablon</DialogTitle>
          <DialogDescription>
            Podaj nazwę nowego szablonu listy zakupów.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1">
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmit();
            }}
            placeholder="np. Cotygodniowe zakupy"
            autoFocus
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-base text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-mint-400"
          />
          {error && <p className="text-xs text-error-text">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={onSubmit} disabled={isPending || !name.trim()}>
            {isPending ? 'Tworzenie...' : 'Utwórz'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({
  template,
  categories,
  onDelete,
  onRename,
  onAddItem,
  onRemoveItem,
}: {
  template: TemplateData;
  categories: Category[];
  onDelete: () => void;
  onRename: (newName: string) => void;
  onAddItem: (item: TemplateItemData) => void;
  onRemoveItem: (itemId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [useResult, setUseResult] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(template.name);
  const [isPending, startTransition] = useTransition();

  const handleUseTemplate = () => {
    setUseResult(null);
    startTransition(async () => {
      const result = await useTemplate(template.id);
      if (result.success) {
        const skippedMsg =
          result.skipped && result.skipped > 0
            ? ` (${result.skipped} juz bylo na liscie)`
            : '';
        setUseResult(`Dodano ${result.added} produktów${skippedMsg}`);
        setTimeout(() => setUseResult(null), 3000);
      } else {
        setUseResult(result.error ?? 'Wystapil blad');
        setTimeout(() => setUseResult(null), 3000);
      }
    });
  };

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === template.name) {
      setIsRenaming(false);
      setRenameValue(template.name);
      return;
    }
    startTransition(async () => {
      const result = await renameTemplate(template.id, trimmed);
      if (result.success) {
        onRename(trimmed);
      }
      setIsRenaming(false);
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        {isRenaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') {
                setIsRenaming(false);
                setRenameValue(template.name);
              }
            }}
            autoFocus
            className="flex-1 rounded-lg border border-mint-300 bg-transparent px-2 py-1 text-base font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-mint-400"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="flex flex-1 items-center gap-2 text-left"
          >
            <span className="flex-1 text-base font-bold text-text-primary">
              {template.name}
            </span>
            <span className="text-xs text-text-tertiary">
              {template.items.length}{' '}
              {template.items.length === 1 ? 'produkt' : 'produktów'}
            </span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-text-tertiary transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        )}

        {isRenaming ? (
          <button
            type="button"
            onClick={handleRenameSubmit}
            disabled={isPending}
            className="shrink-0 text-mint-500 transition-opacity hover:opacity-70"
            aria-label="Zapisz nazwe"
          >
            <Check size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsRenaming(true)}
            className="shrink-0 text-text-tertiary transition-colors hover:text-text-primary"
            aria-label="Zmien nazwe szablonu"
          >
            <Pencil size={16} />
          </button>
        )}

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="shrink-0 text-text-tertiary transition-colors hover:text-error-text"
              aria-label="Usun szablon"
            >
              <Trash2 size={16} />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Usuń szablon</DialogTitle>
              <DialogDescription>
                Czy na pewno chcesz usunąć szablon &ldquo;{template.name}
                &rdquo;? Tej operacji nie można cofnąć.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Anuluj
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  onDelete();
                }}
              >
                Usuń
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Use template button + feedback */}
      <div className="border-t border-border-light px-4 py-2.5">
        {useResult ? (
          <p className="text-center text-sm font-semibold text-mint-600">
            {useResult}
          </p>
        ) : (
          <button
            type="button"
            onClick={handleUseTemplate}
            disabled={isPending || template.items.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-mint-500 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <ShoppingCart size={16} />
            Użyj szablonu
          </button>
        )}
      </div>

      {/* Expandable items section */}
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border-light">
            {template.items.length > 0 && (
              <div>
                {template.items.map((item) => (
                  <TemplateItemRow
                    key={item.id}
                    item={item}
                    onRemove={() => onRemoveItem(item.id)}
                  />
                ))}
              </div>
            )}

            {/* Add item input */}
            <AddTemplateItemInput
              templateId={template.id}
              onAdded={onAddItem}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateItemRow({
  item,
  onRemove,
}: {
  item: TemplateItemData;
  onRemove: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      await removeTemplateItem(item.id);
      onRemove();
    });
  };

  const Icon = item.category_icon ? getCategoryIcon(item.category_icon) : null;

  return (
    <div
      className={`flex items-center gap-3 border-b border-border-light px-4 py-2.5 last:border-b-0 ${
        isPending ? 'opacity-50' : ''
      }`}
    >
      <span className="flex-1 text-sm text-text-primary">
        {item.product_name}
      </span>
      {item.category_name && (
        <span className="flex shrink-0 items-center gap-1 text-xs text-text-tertiary">
          {Icon && <Icon size={12} />}
          {item.category_name}
        </span>
      )}
      <button
        type="button"
        onClick={handleRemove}
        disabled={isPending}
        className="shrink-0 text-text-tertiary transition-colors hover:text-error-text disabled:opacity-30"
        aria-label="Usun produkt z szablonu"
      >
        <X size={16} />
      </button>
    </div>
  );
}

function AddTemplateItemInput({
  templateId,
  onAdded,
}: {
  templateId: string;
  onAdded: (item: TemplateItemData) => void;
}) {
  const [value, setValue] = useState('');
  const [isPending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const searchDebounced = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
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
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.closest('.add-item-wrapper')?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdd = (name: string, categoryId?: string | null, categoryName?: string | null, categoryIcon?: string | null) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setShowDropdown(false);
    setSuggestions([]);
    startTransition(async () => {
      const result = await addTemplateItem(templateId, trimmed, categoryId);
      if (result.success) {
        const tempId = `temp-${Date.now()}`;
        onAdded({
          id: tempId,
          product_name: trimmed,
          category_id: result.category_id ?? categoryId ?? null,
          category_name: result.category_name ?? categoryName ?? null,
          category_icon: result.category_icon ?? categoryIcon ?? null,
          sort_order: 0,
        });
        setValue('');
      }
      inputRef.current?.focus();
    });
  };

  const handleSubmit = () => {
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      const s = suggestions[selectedIndex];
      handleAdd(s.name, s.category_id, s.category_name, s.category_icon);
      return;
    }
    if (selectedIndex === suggestions.length && value.trim()) {
      handleAdd(value.trim());
      return;
    }
    handleAdd(value);
  };

  const exactMatch = suggestions.some(
    (s) => s.name.toLowerCase() === value.trim().toLowerCase(),
  );
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
      if (showDropdown && totalItems > 0)
        setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showDropdown && totalItems > 0)
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    }
  };

  return (
    <div className="add-item-wrapper relative px-3 pb-3 pt-2">
      <div
        className={`flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 transition-colors focus-within:border-mint-400 focus-within:shadow-[0_0_0_2px_rgba(74,222,128,0.15)] ${
          isPending ? 'opacity-60' : ''
        }`}
      >
        <Search size={16} className="shrink-0 text-text-tertiary" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            searchDebounced(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (value.trim() && suggestions.length > 0) setShowDropdown(true);
          }}
          placeholder="Dodaj produkt do szablonu..."
          disabled={isPending}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !value.trim()}
          className="shrink-0 text-mint-500 transition-opacity disabled:opacity-30"
          aria-label="Dodaj produkt"
        >
          <Plus size={20} />
        </button>
      </div>

      {showDropdown && totalItems > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-3 right-3 z-30 mt-1 max-h-[240px] origin-top animate-slide-down overflow-y-auto overflow-x-hidden rounded-xl border border-border bg-surface shadow-lg"
          role="listbox"
        >
          {suggestions.map((s, index) => {
            const Icon = s.category_icon ? getCategoryIcon(s.category_icon) : null;
            return (
              <div
                key={s.id}
                role="option"
                aria-selected={selectedIndex === index}
                onClick={() => handleAdd(s.name, s.category_id, s.category_name, s.category_icon)}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 ${
                  selectedIndex === index ? 'bg-mint-50' : 'hover:bg-mint-50'
                } ${index > 0 ? 'border-t border-border-light' : ''}`}
              >
                <span className="flex-1 text-sm text-text-primary">
                  {s.name}
                </span>
                {s.category_name && (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-text-tertiary">
                    {Icon && <Icon size={12} />}
                    {s.category_name}
                  </span>
                )}
              </div>
            );
          })}
          {showAddNew && (
            <div
              role="option"
              aria-selected={selectedIndex === suggestions.length}
              onClick={() => handleAdd(value.trim())}
              className={`flex cursor-pointer items-center gap-2 border-t border-border-light px-3 py-2.5 ${
                selectedIndex === suggestions.length
                  ? 'bg-mint-200'
                  : 'bg-mint-100 hover:bg-mint-200'
              }`}
            >
              <Plus size={14} className="shrink-0 text-mint-600" />
              <span className="text-sm text-mint-600">
                Dodaj &ldquo;{value.trim()}&rdquo; jako nowy
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
