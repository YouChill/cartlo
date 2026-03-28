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
  Copy,
  ArrowUpDown,
  GripVertical,
  Minus,
  Upload,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
} from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  type ImportTemplatePayload,
  createTemplate,
  deleteTemplate,
  renameTemplate,
  addTemplateItem,
  removeTemplateItem,
  updateTemplateItem,
  useTemplate,
  duplicateTemplate,
  sortTemplateItemsByCategory,
  reorderTemplateItems,
  importTemplate,
} from '@/app/(app)/templates/actions';
import { searchProducts, type ProductSuggestion } from '@/app/(app)/actions';
import { getCategoryIcon } from '@/lib/category-icons';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AVAILABLE_UNITS = ['szt', 'g', 'kg', 'ml', 'l'] as const;

type Category = {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
};

// ---------------------------------------------------------------------------
// TemplatesList (root component)
// ---------------------------------------------------------------------------

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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
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

  const handleImport = () => {
    const trimmed = importJson.trim();
    if (!trimmed) {
      setImportError('Wklej JSON szablonu');
      return;
    }

    let parsed: ImportTemplatePayload;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      setImportError('Nieprawidłowy format JSON');
      return;
    }

    if (!parsed.name?.trim()) {
      setImportError('Brak nazwy szablonu w JSON (pole "name")');
      return;
    }
    if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
      setImportError('Brak produktów w szablonie (pole "items")');
      return;
    }

    startTransition(async () => {
      const result = await importTemplate(parsed);
      if (result.success && result.template) {
        setTemplatesList((prev) => [...prev, result.template!]);
        setImportJson('');
        setImportDialogOpen(false);
        setImportError(null);
      } else {
        setImportError(result.error ?? 'Wystąpił błąd');
      }
    });
  };

  const handleFileImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        setImportJson(text);
        setImportError(null);
      }
    };
    reader.onerror = () => {
      setImportError('Nie udało się odczytać pliku');
    };
    reader.readAsText(file);
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

  const handleEditItem = (
    templateId: string,
    itemId: string,
    updatedItem: Partial<TemplateItemData>,
  ) => {
    setTemplatesList((prev) =>
      prev.map((t) =>
        t.id === templateId
          ? {
              ...t,
              items: t.items.map((i) =>
                i.id === itemId ? { ...i, ...updatedItem } : i,
              ),
            }
          : t,
      ),
    );
  };

  const handleDuplicateTemplate = (newTemplate: TemplateData) => {
    setTemplatesList((prev) => [...prev, newTemplate]);
  };

  const handleReorderItems = (templateId: string, items: TemplateItemData[]) => {
    setTemplatesList((prev) =>
      prev.map((t) => (t.id === templateId ? { ...t, items } : t)),
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
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setCreateDialogOpen(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-mint-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <Plus size={18} />
              Nowy szablon
            </button>
            <button
              type="button"
              onClick={() => setImportDialogOpen(true)}
              className="flex items-center justify-center gap-2 rounded-2xl border-[1.5px] border-mint-300 bg-white px-5 py-2.5 text-sm font-semibold text-mint-600 transition-colors hover:bg-mint-50"
            >
              <Upload size={18} />
              Importuj szablon
            </button>
          </div>
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

        <ImportTemplateDialog
          open={importDialogOpen}
          onOpenChange={(open) => {
            setImportDialogOpen(open);
            if (!open) {
              setImportJson('');
              setImportError(null);
            }
          }}
          json={importJson}
          onJsonChange={setImportJson}
          error={importError}
          onSubmit={handleImport}
          onFileImport={handleFileImport}
          isPending={isPending}
        />
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Create & Import buttons */}
      <div className="flex gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setCreateDialogOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-mint-300 bg-mint-50 py-3 text-sm font-semibold text-mint-600 transition-colors hover:bg-mint-100"
        >
          <Plus size={18} />
          Nowy szablon
        </button>
        <button
          type="button"
          onClick={() => setImportDialogOpen(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border-[1.5px] border-mint-300 bg-white px-4 py-3 text-sm font-semibold text-mint-600 transition-colors hover:bg-mint-50"
          title="Importuj szablon z JSON"
        >
          <Upload size={18} />
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
            onEditItem={(itemId, updatedItem) =>
              handleEditItem(template.id, itemId, updatedItem)
            }
            onDuplicate={handleDuplicateTemplate}
            onReorderItems={(items) =>
              handleReorderItems(template.id, items)
            }
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

      <ImportTemplateDialog
        open={importDialogOpen}
        onOpenChange={(open) => {
          setImportDialogOpen(open);
          if (!open) {
            setImportJson('');
            setImportError(null);
          }
        }}
        json={importJson}
        onJsonChange={setImportJson}
        error={importError}
        onSubmit={handleImport}
        onFileImport={handleFileImport}
        isPending={isPending}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// CreateTemplateDialog
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// ImportTemplateDialog
// ---------------------------------------------------------------------------

function ImportTemplateDialog({
  open,
  onOpenChange,
  json,
  onJsonChange,
  error,
  onSubmit,
  onFileImport,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  json: string;
  onJsonChange: (v: string) => void;
  error: string | null;
  onSubmit: () => void;
  onFileImport: (file: File) => void;
  isPending: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importuj szablon</DialogTitle>
          <DialogDescription>
            Wklej JSON szablonu lub załaduj plik .json
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <textarea
            value={json}
            onChange={(e) => onJsonChange(e.target.value)}
            placeholder={`{\n  "name": "Mój szablon",\n  "items": [\n    { "product_name": "Mleko", "category": "Nabiał", "quantity": 2, "unit": "szt" }\n  ]\n}`}
            rows={8}
            className="rounded-xl border border-border bg-surface px-4 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-mint-400"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileImport(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-raised px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface"
          >
            <Upload size={16} />
            Załaduj plik .json
          </button>
          {error && <p className="text-xs text-error-text">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={onSubmit} disabled={isPending || !json.trim()}>
            {isPending ? 'Importowanie...' : 'Importuj'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// TemplateCard
// ---------------------------------------------------------------------------

function TemplateCard({
  template,
  categories,
  onDelete,
  onRename,
  onAddItem,
  onRemoveItem,
  onEditItem,
  onDuplicate,
  onReorderItems,
}: {
  template: TemplateData;
  categories: Category[];
  onDelete: () => void;
  onRename: (newName: string) => void;
  onAddItem: (item: TemplateItemData) => void;
  onRemoveItem: (itemId: string) => void;
  onEditItem: (itemId: string, updatedItem: Partial<TemplateItemData>) => void;
  onDuplicate: (newTemplate: TemplateData) => void;
  onReorderItems: (items: TemplateItemData[]) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [useResult, setUseResult] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(template.name);
  const [isPending, startTransition] = useTransition();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  const handleDuplicate = () => {
    startTransition(async () => {
      const result = await duplicateTemplate(template.id);
      if (result.success && result.template) {
        onDuplicate(result.template);
      }
    });
  };

  const handleSortByCategory = () => {
    startTransition(async () => {
      const result = await sortTemplateItemsByCategory(template.id);
      if (result.success && result.sortedIds) {
        // Reorder items locally based on returned sorted IDs
        const itemMap = new Map(template.items.map((i) => [i.id, i]));
        const sorted = result.sortedIds
          .map((id) => itemMap.get(id))
          .filter(Boolean) as TemplateItemData[];
        onReorderItems(sorted);
      }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = template.items.findIndex((i) => i.id === active.id);
    const newIndex = template.items.findIndex((i) => i.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(template.items, oldIndex, newIndex);
    onReorderItems(reordered);

    // Persist to server
    startTransition(async () => {
      await reorderTemplateItems(
        template.id,
        reordered.map((i) => i.id),
      );
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
          <>
            <button
              type="button"
              onClick={() => setIsRenaming(true)}
              className="shrink-0 text-text-tertiary transition-colors hover:text-text-primary"
              aria-label="Zmien nazwe szablonu"
            >
              <Pencil size={16} />
            </button>

            {/* Duplicate button */}
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={isPending}
              className="shrink-0 text-text-tertiary transition-colors hover:text-mint-500 disabled:opacity-30"
              aria-label="Duplikuj szablon"
            >
              <Copy size={16} />
            </button>

            {/* Sort by category button */}
            <button
              type="button"
              onClick={handleSortByCategory}
              disabled={isPending || template.items.length < 2}
              className="shrink-0 text-text-tertiary transition-colors hover:text-mint-500 disabled:opacity-30"
              aria-label="Sortuj wg kategorii"
            >
              <ArrowUpDown size={16} />
            </button>
          </>
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={template.items.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div>
                    {template.items.map((item) => (
                      <SortableTemplateItemRow
                        key={item.id}
                        item={item}
                        onRemove={() => onRemoveItem(item.id)}
                        onEdit={(updatedItem) =>
                          onEditItem(item.id, updatedItem)
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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

// ---------------------------------------------------------------------------
// SortableTemplateItemRow (wraps TemplateItemRow with drag handle)
// ---------------------------------------------------------------------------

function SortableTemplateItemRow({
  item,
  onRemove,
  onEdit,
}: {
  item: TemplateItemData;
  onRemove: () => void;
  onEdit: (updatedItem: Partial<TemplateItemData>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: isDragging ? ('relative' as const) : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TemplateItemRow
        item={item}
        onRemove={onRemove}
        onEdit={onEdit}
        dragAttributes={attributes}
        dragListeners={listeners}
        isDragging={isDragging}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// TemplateItemRow (with quantity controls, unit selector, drag handle)
// ---------------------------------------------------------------------------

function TemplateItemRow({
  item,
  onRemove,
  onEdit,
  dragAttributes,
  dragListeners,
  isDragging,
}: {
  item: TemplateItemData;
  onRemove: () => void;
  onEdit: (updatedItem: Partial<TemplateItemData>) => void;
  dragAttributes?: DraggableAttributes;
  dragListeners?: SyntheticListenerMap;
  isDragging?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.product_name);

  const handleRemove = () => {
    startTransition(async () => {
      await removeTemplateItem(item.id);
      onRemove();
    });
  };

  const handleEditSubmit = () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === item.product_name) {
      setIsEditing(false);
      setEditValue(item.product_name);
      return;
    }
    startTransition(async () => {
      const result = await updateTemplateItem(item.id, {
        productName: trimmed,
      });
      if (result.success) {
        onEdit({ product_name: trimmed });
      }
      setIsEditing(false);
    });
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = Math.max(0.5, item.quantity + delta);
    // Determine step based on unit
    const step = item.unit === 'g' || item.unit === 'ml' ? 50 : 1;
    const adjusted = item.unit === 'g' || item.unit === 'ml'
      ? Math.max(step, item.quantity + delta * step)
      : Math.max(0.5, item.quantity + delta);

    onEdit({ quantity: adjusted });
    startTransition(async () => {
      await updateTemplateItem(item.id, { quantity: adjusted });
    });
  };

  const handleUnitChange = (newUnit: string) => {
    onEdit({ unit: newUnit });
    startTransition(async () => {
      await updateTemplateItem(item.id, { unit: newUnit });
    });
  };

  const Icon = item.category_icon ? getCategoryIcon(item.category_icon) : null;

  const formatQuantity = (qty: number) => {
    return qty % 1 === 0 ? qty.toFixed(0) : qty.toString();
  };

  return (
    <div
      className={`border-b border-border-light last:border-b-0 ${
        isPending ? 'opacity-50' : ''
      } ${isDragging ? 'bg-mint-50 shadow-md' : ''}`}
    >
      {/* Top row: drag handle, product name, category, delete */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Drag handle */}
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none text-text-tertiary transition-colors hover:text-text-secondary active:cursor-grabbing"
          aria-label="Przeciagnij aby zmienic kolejnosc"
          {...dragAttributes}
          {...dragListeners}
        >
          <GripVertical size={16} />
        </button>

        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEditSubmit();
              if (e.key === 'Escape') {
                setIsEditing(false);
                setEditValue(item.product_name);
              }
            }}
            onBlur={handleEditSubmit}
            autoFocus
            disabled={isPending}
            className="flex-1 rounded-lg border border-mint-300 bg-transparent px-2 py-0.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-mint-400"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex-1 text-left text-sm text-text-primary transition-colors hover:text-mint-600"
          >
            {item.product_name}
          </button>
        )}

        {!isEditing && item.category_name && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-text-tertiary">
            {Icon && <Icon size={12} />}
            {item.category_name}
          </span>
        )}

        {isEditing ? (
          <button
            type="button"
            onClick={handleEditSubmit}
            disabled={isPending}
            className="shrink-0 text-mint-500 transition-opacity hover:opacity-70"
            aria-label="Zapisz nazwe produktu"
          >
            <Check size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            className="shrink-0 text-text-tertiary transition-colors hover:text-error-text disabled:opacity-30"
            aria-label="Usun produkt z szablonu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Bottom row: quantity controls + unit selector */}
      {!isEditing && (
        <div className="flex items-center gap-2 px-3 pb-2.5">
          {/* Spacer for drag handle alignment */}
          <div className="w-4 shrink-0" />

          {/* Quantity controls */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-1 py-0.5">
            <button
              type="button"
              onClick={() => handleQuantityChange(-1)}
              disabled={
                isPending ||
                (item.unit === 'g' || item.unit === 'ml'
                  ? item.quantity <= 50
                  : item.quantity <= 0.5)
              }
              className="flex h-6 w-6 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-mint-50 hover:text-mint-600 disabled:opacity-30"
              aria-label="Zmniejsz ilosc"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-[2.5rem] text-center text-sm font-semibold text-text-primary">
              {formatQuantity(item.quantity)}
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
                  if (u !== item.unit) handleUnitChange(u);
                }}
                disabled={isPending}
                className={`rounded-lg px-2 py-0.5 text-xs font-medium transition-colors ${
                  u === item.unit
                    ? 'bg-mint-500 text-white'
                    : 'text-text-tertiary hover:bg-mint-50 hover:text-mint-600'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AddTemplateItemInput
// ---------------------------------------------------------------------------

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
        !inputRef.current
          .closest('.add-item-wrapper')
          ?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdd = (
    name: string,
    categoryId?: string | null,
    categoryName?: string | null,
    categoryIcon?: string | null,
  ) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setShowDropdown(false);
    setSuggestions([]);
    startTransition(async () => {
      const result = await addTemplateItem(templateId, trimmed, categoryId);
      if (result.success && result.id) {
        onAdded({
          id: result.id,
          product_name: trimmed,
          category_id: categoryId ?? null,
          category_name: categoryName ?? null,
          category_icon: categoryIcon ?? null,
          quantity: 1,
          unit: result.unit ?? 'szt',
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
            const SuggIcon = s.category_icon
              ? getCategoryIcon(s.category_icon)
              : null;
            return (
              <div
                key={s.id}
                role="option"
                aria-selected={selectedIndex === index}
                onClick={() =>
                  handleAdd(
                    s.name,
                    s.category_id,
                    s.category_name,
                    s.category_icon,
                  )
                }
                className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 ${
                  selectedIndex === index ? 'bg-mint-50' : 'hover:bg-mint-50'
                } ${index > 0 ? 'border-t border-border-light' : ''}`}
              >
                <span className="flex-1 text-sm text-text-primary">
                  {s.name}
                </span>
                {s.category_name && (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-text-tertiary">
                    {SuggIcon && <SuggIcon size={12} />}
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
