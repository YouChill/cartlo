import { eq, and, or, isNull, ilike, asc, sql, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { shoppingItems, categories, products, profiles } from '@/lib/db/schema';
import { notifyListUpdate } from '@/lib/pusher/server';
import { removeDiacritics } from '@/lib/utils';
import {
  generateEmbedding,
  findSimilarProducts,
  saveProductEmbedding,
  upsertProductEmbedding,
  isEmbeddingConfigured,
} from '@/lib/embeddings';

// ---------------------------------------------------------------------------
// Shared constants & types
// ---------------------------------------------------------------------------

export const VALID_UNITS = ['szt', 'g', 'kg', 'ml', 'l'] as const;
// quantity is NUMERIC(10,2) — cap at what the column can hold sensibly
export const MAX_QUANTITY = 9999.99;

export type ShoppingItemRow = typeof shoppingItems.$inferSelect;

export type CategoryInfo = { id: string; name: string; icon: string };

export type UpdateItemPatch = {
  productName?: string;
  quantity?: number;
  unit?: string;
  categoryId?: string | null;
  isChecked?: boolean;
};

export type BulkItemInput = {
  productName: string;
  categoryName?: string | null;
  quantity?: number;
  unit?: string;
};

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

/** All categories visible to a family (global defaults + family-specific). */
export async function getFamilyCategories(
  familyId: string,
): Promise<(CategoryInfo & { sortOrder: number })[]> {
  const cats = await db
    .select({
      id: categories.id,
      name: categories.name,
      icon: categories.icon,
      sortOrder: categories.sortOrder,
    })
    .from(categories)
    .where(or(isNull(categories.familyId), eq(categories.familyId, familyId)))
    .orderBy(asc(categories.sortOrder));
  return cats;
}

/**
 * Case- and diacritic-insensitive category name lookup
 * (same matching rules as template import: "Nabiał" ≡ "nabial").
 */
export function buildCategoryNameIndex(
  cats: CategoryInfo[],
): Record<string, CategoryInfo> {
  const byName: Record<string, CategoryInfo> = {};
  cats.forEach((c) => {
    byName[c.name.toLowerCase()] = c;
    byName[removeDiacritics(c.name).toLowerCase()] = c;
  });
  return byName;
}

export function matchCategoryByName(
  index: Record<string, CategoryInfo>,
  name: string,
): CategoryInfo | null {
  return (
    index[name.toLowerCase()] ??
    index[removeDiacritics(name).toLowerCase()] ??
    null
  );
}

/** Display names of family members keyed by profile id. */
export async function getMemberNames(
  familyId: string,
): Promise<Record<string, string>> {
  const members = await db
    .select({ id: profiles.id, displayName: profiles.displayName })
    .from(profiles)
    .where(eq(profiles.familyId, familyId));

  const names: Record<string, string> = {};
  members.forEach((m) => {
    names[m.id] = m.displayName;
  });
  return names;
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getShoppingList(familyId: string): Promise<{
  items: ShoppingItemRow[];
  categories: (CategoryInfo & { sortOrder: number })[];
  memberNames: Record<string, string>;
}> {
  const [items, cats, memberNames] = await Promise.all([
    db
      .select()
      .from(shoppingItems)
      .where(eq(shoppingItems.familyId, familyId))
      .orderBy(asc(shoppingItems.productName)),
    getFamilyCategories(familyId),
    getMemberNames(familyId),
  ]);

  return { items, categories: cats, memberNames };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export type AddItemResult =
  | { ok: true; item: ShoppingItemRow }
  | { ok: false; error: 'duplicate'; itemId: string };

/**
 * Add a single item to the family's list. When `categoryId` is undefined the
 * category is auto-detected from the products table (exact match first, then
 * semantic search via embeddings), teaching the products table as a side
 * effect — same behavior the in-app "add product" flow has always had.
 */
export async function addShoppingItem(params: {
  familyId: string;
  profileId: string;
  productName: string;
  quantity?: number;
  unit?: string;
  categoryId?: string | null;
}): Promise<AddItemResult> {
  const { familyId, profileId } = params;
  const trimmed = params.productName.trim();

  // Check for duplicates on active list
  const existing = await db
    .select({ id: shoppingItems.id })
    .from(shoppingItems)
    .where(
      and(
        eq(shoppingItems.familyId, familyId),
        eq(shoppingItems.isChecked, false),
        ilike(shoppingItems.productName, trimmed),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return { ok: false, error: 'duplicate', itemId: existing[0].id };
  }

  // Determine category: use known category if provided, otherwise auto-detect
  let categoryId: string | null = params.categoryId ?? null;

  if (params.categoryId === undefined) {
    const [knownProduct] = await db
      .select({
        id: products.id,
        categoryId: products.categoryId,
        usageCount: products.usageCount,
      })
      .from(products)
      .where(
        and(
          ilike(products.name, trimmed),
          or(isNull(products.familyId), eq(products.familyId, familyId)),
        ),
      )
      .limit(1);

    if (knownProduct) {
      categoryId = knownProduct.categoryId;
      // Increment usage_count for better autocomplete sorting
      await db
        .update(products)
        .set({ usageCount: knownProduct.usageCount + 1 })
        .where(eq(products.id, knownProduct.id));
    } else {
      // Product not found by exact match — try semantic search via embeddings
      let embeddingCategoryId: string | null = null;
      let productEmbedding: number[] | null = null;

      if (isEmbeddingConfigured()) {
        try {
          productEmbedding = await generateEmbedding(trimmed);
          const similar = await findSimilarProducts(
            productEmbedding,
            familyId,
            {
              threshold: 0.8,
              limit: 1,
              requireCategory: true,
            },
          );

          if (similar.length > 0 && similar[0].categoryId) {
            embeddingCategoryId = similar[0].categoryId;
          }
        } catch (err) {
          console.error('[addShoppingItem] Embedding generation failed:', err);
        }
      }

      categoryId = embeddingCategoryId;

      // Add as new product (with embedding if available)
      try {
        const [newProduct] = await db
          .insert(products)
          .values({
            name: trimmed,
            categoryId,
            familyId,
            usageCount: 1,
          })
          .onConflictDoUpdate({
            target: [products.name, products.familyId],
            set: { categoryId, usageCount: sql`${products.usageCount} + 1` },
          })
          .returning({ id: products.id });

        // Save embedding for the new product (non-blocking)
        if (isEmbeddingConfigured() && newProduct) {
          if (productEmbedding) {
            saveProductEmbedding(newProduct.id, productEmbedding).catch(
              () => {},
            );
          } else {
            upsertProductEmbedding(newProduct.id, trimmed).catch(() => {});
          }
        }
      } catch {
        // Product upsert failed — continue with shopping item insertion
      }
    }
  }

  const [item] = await db
    .insert(shoppingItems)
    .values({
      familyId,
      productName: trimmed,
      categoryId,
      quantity: (params.quantity ?? 1).toString(),
      unit: params.unit ?? 'szt',
      addedBy: profileId,
    })
    .returning();

  notifyListUpdate(familyId);
  return { ok: true, item };
}

/**
 * Update an item, always scoped to the family (id alone is never trusted).
 * Returns the updated row, or null when the item doesn't belong to the family.
 */
export async function updateShoppingItem(params: {
  familyId: string;
  itemId: string;
  patch: UpdateItemPatch;
  /** Profile credited as checkedBy when the patch checks the item. */
  actorProfileId: string;
}): Promise<ShoppingItemRow | null> {
  const { familyId, itemId, patch, actorProfileId } = params;

  const updateSet: Partial<typeof shoppingItems.$inferInsert> = {};

  if (patch.productName !== undefined) {
    updateSet.productName = patch.productName.trim();
  }
  if (patch.quantity !== undefined) {
    updateSet.quantity = patch.quantity.toString();
  }
  if (patch.unit !== undefined) {
    updateSet.unit = patch.unit;
  }
  if (patch.categoryId !== undefined) {
    updateSet.categoryId = patch.categoryId;
  }
  if (patch.isChecked !== undefined) {
    updateSet.isChecked = patch.isChecked;
    updateSet.checkedBy = patch.isChecked ? actorProfileId : null;
    updateSet.checkedAt = patch.isChecked ? new Date() : null;
  }

  if (Object.keys(updateSet).length === 0) return null;

  const [item] = await db
    .update(shoppingItems)
    .set(updateSet)
    .where(
      and(eq(shoppingItems.id, itemId), eq(shoppingItems.familyId, familyId)),
    )
    .returning();

  if (!item) return null;

  notifyListUpdate(familyId);
  return item;
}

/** Delete an item scoped to the family. Returns false when not found. */
export async function deleteShoppingItem(params: {
  familyId: string;
  itemId: string;
}): Promise<boolean> {
  const { familyId, itemId } = params;

  const deleted = await db
    .delete(shoppingItems)
    .where(
      and(eq(shoppingItems.id, itemId), eq(shoppingItems.familyId, familyId)),
    )
    .returning({ id: shoppingItems.id });

  if (deleted.length === 0) return false;

  notifyListUpdate(familyId);
  return true;
}

/**
 * Add a whole list of items in one shot (agent bulk import). Duplicates —
 * against the active list and within the batch — are skipped, not errors.
 * Categories are matched by name (diacritic-insensitive) with a products-table
 * fallback. Embeddings are intentionally skipped: generating N embeddings in
 * one serverless request is too slow.
 */
export async function bulkAddShoppingItems(params: {
  familyId: string;
  profileId: string;
  items: BulkItemInput[];
}): Promise<{ added: ShoppingItemRow[]; skipped: string[] }> {
  const { familyId, profileId } = params;

  const cats = await getFamilyCategories(familyId);
  const categoryIndex = buildCategoryNameIndex(cats);

  const activeItems = await db
    .select({ productName: shoppingItems.productName })
    .from(shoppingItems)
    .where(
      and(
        eq(shoppingItems.familyId, familyId),
        eq(shoppingItems.isChecked, false),
      ),
    );

  const seenNames = new Set(
    activeItems.map((i) => i.productName.toLowerCase()),
  );

  // Resolve product-table categories for all names in a single query
  const inputNames = params.items
    .map((i) => i.productName.trim())
    .filter(Boolean);

  const productCategoryByName: Record<string, string | null> = {};
  if (inputNames.length > 0) {
    const knownProducts = await db
      .select({ name: products.name, categoryId: products.categoryId })
      .from(products)
      .where(
        and(
          inArray(
            sql`lower(${products.name})`,
            inputNames.map((n) => n.toLowerCase()),
          ),
          or(isNull(products.familyId), eq(products.familyId, familyId)),
        ),
      );
    knownProducts.forEach((p) => {
      // Family-specific products override global ones on name collisions;
      // either way any match beats "no category"
      productCategoryByName[p.name.toLowerCase()] ??= p.categoryId;
    });
  }

  const skipped: string[] = [];
  const toInsert: (typeof shoppingItems.$inferInsert)[] = [];

  for (const input of params.items) {
    const name = input.productName.trim();
    if (!name) continue;

    if (seenNames.has(name.toLowerCase())) {
      skipped.push(name);
      continue;
    }
    seenNames.add(name.toLowerCase());

    const matchedCategory = input.categoryName
      ? matchCategoryByName(categoryIndex, input.categoryName)
      : null;
    const categoryId =
      matchedCategory?.id ?? productCategoryByName[name.toLowerCase()] ?? null;

    const quantity = input.quantity && input.quantity > 0 ? input.quantity : 1;
    const unit =
      input.unit && (VALID_UNITS as readonly string[]).includes(input.unit)
        ? input.unit
        : 'szt';

    toInsert.push({
      familyId,
      productName: name,
      categoryId,
      quantity: quantity.toString(),
      unit,
      addedBy: profileId,
    });
  }

  if (toInsert.length === 0) return { added: [], skipped };

  const added = await db.insert(shoppingItems).values(toInsert).returning();

  notifyListUpdate(familyId);
  return { added, skipped };
}
