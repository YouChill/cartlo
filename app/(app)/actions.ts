'use server';

import { revalidatePath } from 'next/cache';
import { eq, and, or, isNull, ilike, desc, sql, inArray } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles, shoppingItems, products, categories } from '@/lib/db/schema';
import { notifyListUpdate } from '@/lib/pusher/server';
import {
  generateEmbedding,
  findSimilarProducts,
  saveProductEmbedding,
  upsertProductEmbedding,
  isEmbeddingConfigured,
} from '@/lib/embeddings';

export async function toggleShoppingItem(
  itemId: string,
  isChecked: boolean,
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'Nie jesteś zalogowany' };
  }

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId) {
    return { success: false, error: 'Nie należysz do rodziny' };
  }

  await db
    .update(shoppingItems)
    .set({
      isChecked,
      checkedBy: isChecked ? userId : null,
      checkedAt: isChecked ? new Date() : null,
    })
    .where(and(eq(shoppingItems.id, itemId), eq(shoppingItems.familyId, profile.familyId)));

  revalidatePath('/');
  if (profile?.familyId) notifyListUpdate(profile.familyId);
  return { success: true };
}

export type ProductSuggestion = {
  id: string;
  name: string;
  category_id: string | null;
  category_name: string | null;
  category_icon: string | null;
};

export type CategoryPrediction = {
  id: string;
  name: string;
  icon: string;
};

export type ProductSearchResult = {
  suggestions: ProductSuggestion[];
  predicted_category: CategoryPrediction | null;
};

type ProductRow = {
  id: string;
  name: string;
  categoryId: string | null;
  usageCount: number;
  familyId: string | null;
};

// The same product name can exist twice: as a global seed product and as a
// family-specific override (created e.g. when the family changes a global
// product's category in settings). Show each name only once, preferring the
// family entry since it carries the family's category choice.
function dedupeProductsByName(rows: ProductRow[]): ProductRow[] {
  const byName = new Map<string, ProductRow>();
  for (const row of rows) {
    const key = row.name.trim().toLowerCase();
    const current = byName.get(key);
    if (!current) {
      byName.set(key, row);
      continue;
    }
    const rowIsFamily = row.familyId !== null;
    const currentIsFamily = current.familyId !== null;
    if (
      (rowIsFamily && !currentIsFamily) ||
      (rowIsFamily === currentIsFamily && row.usageCount > current.usageCount)
    ) {
      byName.set(key, row);
    }
  }
  return [...byName.values()];
}

export async function searchProducts(
  query: string,
): Promise<ProductSearchResult> {
  const empty: ProductSearchResult = {
    suggestions: [],
    predicted_category: null,
  };

  const trimmed = query.trim();
  if (!trimmed) return empty;

  const userId = await getCurrentUserId();
  if (!userId) return empty;

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId) return empty;

  // Search products by name (case-insensitive). Fetch more rows than we show
  // so deduplication still leaves enough results.
  const matchedRows = await db
    .select({
      id: products.id,
      name: products.name,
      categoryId: products.categoryId,
      usageCount: products.usageCount,
      familyId: products.familyId,
    })
    .from(products)
    .where(
      and(
        ilike(products.name, `%${trimmed}%`),
        or(isNull(products.familyId), eq(products.familyId, profile.familyId)),
      ),
    )
    .orderBy(desc(products.usageCount))
    .limit(16);

  const matchedProducts = dedupeProductsByName(matchedRows).slice(0, 8);

  let queryEmbedding: number[] | null = null;

  // If ILIKE returned fewer than 3 results, supplement with semantic search
  let semanticProducts: ProductRow[] = [];
  if (matchedProducts.length < 3 && isEmbeddingConfigured()) {
    try {
      queryEmbedding = await generateEmbedding(trimmed);
      const similar = await findSimilarProducts(
        queryEmbedding,
        profile.familyId,
        { threshold: 0.7, limit: 8 - matchedProducts.length },
      );

      if (similar.length > 0) {
        // Filter out products already found by ILIKE (by id and by name, so
        // a global/family duplicate pair never shows up twice)
        const existingIds = new Set(matchedProducts.map((p) => p.id));
        const existingNames = new Set(
          matchedProducts.map((p) => p.name.trim().toLowerCase()),
        );
        const newSimilar = similar.filter(
          (s) =>
            !existingIds.has(s.id) &&
            !existingNames.has(s.name.trim().toLowerCase()),
        );

        if (newSimilar.length > 0) {
          // Fetch full product info for semantic results
          const semanticIds = newSimilar.map((s) => s.id);
          const semanticRows = await db
            .select({
              id: products.id,
              name: products.name,
              categoryId: products.categoryId,
              usageCount: products.usageCount,
              familyId: products.familyId,
            })
            .from(products)
            .where(inArray(products.id, semanticIds));
          semanticProducts = dedupeProductsByName(semanticRows);
        }
      }
    } catch (err) {
      console.error('[searchProducts] Semantic search failed:', err);
    }
  }

  const allProducts = [...matchedProducts, ...semanticProducts];

  // Predict a category for the typed text so the UI can suggest it for new
  // products. Skip when the text already matches a known product exactly.
  let predictedCategoryId: string | null = null;
  const hasExactMatch = allProducts.some(
    (p) => p.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (!hasExactMatch && trimmed.length >= 3 && isEmbeddingConfigured()) {
    try {
      if (!queryEmbedding) {
        queryEmbedding = await generateEmbedding(trimmed);
      }
      const [best] = await findSimilarProducts(
        queryEmbedding,
        profile.familyId,
        { threshold: 0.7, limit: 1, requireCategory: true },
      );
      if (best?.categoryId) {
        predictedCategoryId = best.categoryId;
      }
    } catch (err) {
      console.error('[searchProducts] Category prediction failed:', err);
    }
  }

  if (allProducts.length === 0 && !predictedCategoryId) return empty;

  // Fetch category names for matched products and the predicted category
  const categoryIds = [
    ...new Set(
      [...allProducts.map((p) => p.categoryId), predictedCategoryId].filter(
        Boolean,
      ),
    ),
  ] as string[];

  const categoryMap: Record<string, { name: string; icon: string }> = {};
  if (categoryIds.length > 0) {
    const cats = await db
      .select({
        id: categories.id,
        name: categories.name,
        icon: categories.icon,
      })
      .from(categories)
      .where(inArray(categories.id, categoryIds));

    cats.forEach((c) => {
      categoryMap[c.id] = { name: c.name, icon: c.icon };
    });
  }

  return {
    suggestions: allProducts.map((p) => ({
      id: p.id,
      name: p.name,
      category_id: p.categoryId,
      category_name: p.categoryId
        ? (categoryMap[p.categoryId]?.name ?? null)
        : null,
      category_icon: p.categoryId
        ? (categoryMap[p.categoryId]?.icon ?? null)
        : null,
    })),
    predicted_category:
      predictedCategoryId && categoryMap[predictedCategoryId]
        ? {
            id: predictedCategoryId,
            name: categoryMap[predictedCategoryId].name,
            icon: categoryMap[predictedCategoryId].icon,
          }
        : null,
  };
}

export async function addProduct(
  productName: string,
  knownCategoryId?: string | null,
  quantity: number = 1,
  unit: string = 'szt',
): Promise<{ success: boolean; error?: string }> {
  const trimmed = productName.trim();
  if (!trimmed) {
    return { success: false, error: 'Nazwa produktu nie może być pusta' };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'Nie jesteś zalogowany' };
  }

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId) {
    return { success: false, error: 'Nie należysz do rodziny' };
  }

  // Check for duplicates on active list
  const existing = await db
    .select({ id: shoppingItems.id })
    .from(shoppingItems)
    .where(
      and(
        eq(shoppingItems.familyId, profile.familyId),
        eq(shoppingItems.isChecked, false),
        ilike(shoppingItems.productName, trimmed),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return { success: false, error: 'Ten produkt już jest na liście' };
  }

  // Determine category: use known category if provided, otherwise auto-detect
  let categoryId: string | null = knownCategoryId ?? null;

  // Look up product in products table (exact, case-insensitive)
  const [knownProduct] = await db
    .select({
      id: products.id,
      name: products.name,
      categoryId: products.categoryId,
      usageCount: products.usageCount,
      familyId: products.familyId,
    })
    .from(products)
    .where(
      and(
        ilike(products.name, trimmed),
        or(isNull(products.familyId), eq(products.familyId, profile.familyId)),
      ),
    )
    .limit(1);

  if (knownProduct) {
    if (knownCategoryId === undefined) {
      categoryId = knownProduct.categoryId;
    }

    const categoryChanged =
      knownCategoryId !== undefined &&
      categoryId !== null &&
      categoryId !== knownProduct.categoryId;

    if (categoryChanged && knownProduct.familyId === null) {
      // Global seed products are shared across families — record the chosen
      // category as a family-specific override instead of mutating the
      // global row
      try {
        await db
          .insert(products)
          .values({
            name: knownProduct.name,
            categoryId,
            familyId: profile.familyId,
            usageCount: 1,
          })
          .onConflictDoUpdate({
            target: [products.name, products.familyId],
            set: { categoryId, usageCount: sql`${products.usageCount} + 1` },
          });
      } catch {
        // Override creation failed — continue with shopping item insertion
      }
    } else {
      // Increment usage_count for better autocomplete sorting and persist
      // the chosen category on the family product
      await db
        .update(products)
        .set({
          usageCount: knownProduct.usageCount + 1,
          ...(categoryChanged ? { categoryId } : {}),
        })
        .where(eq(products.id, knownProduct.id));
    }
  } else {
    // Product unknown — generate an embedding and, when no category was
    // chosen by the user, predict one from semantically similar products
    let productEmbedding: number[] | null = null;

    if (isEmbeddingConfigured()) {
      try {
        productEmbedding = await generateEmbedding(trimmed);
        if (categoryId === null) {
          const similar = await findSimilarProducts(
            productEmbedding,
            profile.familyId,
            { threshold: 0.8, limit: 1, requireCategory: true },
          );

          if (similar.length > 0 && similar[0].categoryId) {
            categoryId = similar[0].categoryId;
          }
        }
      } catch (err) {
        console.error('[addProduct] Embedding generation failed:', err);
      }
    }

    // Add as new product so future searches and predictions know it
    try {
      const [newProduct] = await db
        .insert(products)
        .values({
          name: trimmed,
          categoryId,
          familyId: profile.familyId,
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
          saveProductEmbedding(newProduct.id, productEmbedding).catch(() => {});
        } else {
          upsertProductEmbedding(newProduct.id, trimmed).catch(() => {});
        }
      }
    } catch {
      // Product upsert failed — continue with shopping item insertion
    }
  }

  // Insert shopping item
  await db.insert(shoppingItems).values({
    familyId: profile.familyId,
    productName: trimmed,
    categoryId,
    quantity: quantity.toString(),
    unit,
    addedBy: userId,
  });

  revalidatePath('/');
  notifyListUpdate(profile.familyId);
  return { success: true };
}

export async function classifyProduct(
  itemId: string,
  productName: string,
  categoryId: string,
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'Nie jesteś zalogowany' };
  }

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId) {
    return { success: false, error: 'Nie należysz do rodziny' };
  }

  // Update the shopping item's category (scoped to user's family)
  await db
    .update(shoppingItems)
    .set({ categoryId })
    .where(and(eq(shoppingItems.id, itemId), eq(shoppingItems.familyId, profile.familyId)));

  // Upsert product — teach the system for future auto-categorization
  const [existingProduct] = await db
    .select({ id: products.id })
    .from(products)
    .where(
      and(
        ilike(products.name, productName),
        or(isNull(products.familyId), eq(products.familyId, profile.familyId)),
      ),
    )
    .limit(1);

  if (existingProduct) {
    await db
      .update(products)
      .set({ categoryId })
      .where(eq(products.id, existingProduct.id));

    // Update embedding for this product (non-blocking)
    if (isEmbeddingConfigured()) {
      upsertProductEmbedding(existingProduct.id, productName).catch(() => {});
    }
  } else {
    try {
      const [newProduct] = await db
        .insert(products)
        .values({
          name: productName,
          categoryId,
          familyId: profile.familyId,
          usageCount: 1,
        })
        .onConflictDoUpdate({
          target: [products.name, products.familyId],
          set: { categoryId },
        })
        .returning({ id: products.id });

      // Generate embedding for new product (non-blocking)
      if (isEmbeddingConfigured() && newProduct) {
        upsertProductEmbedding(newProduct.id, productName).catch(() => {});
      }
    } catch {
      // Product upsert failed — classification of the shopping item
      // already succeeded above, so we can safely continue.
    }
  }

  revalidatePath('/');
  notifyListUpdate(profile.familyId);
  return { success: true };
}

export async function updateQuantity(
  itemId: string,
  newQuantity: number,
): Promise<{ success: boolean; error?: string }> {
  if (newQuantity <= 0) {
    return { success: false, error: 'Ilość musi być większa od 0' };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'Nie jesteś zalogowany' };
  }

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  await db
    .update(shoppingItems)
    .set({ quantity: newQuantity.toString() })
    .where(eq(shoppingItems.id, itemId));

  revalidatePath('/');
  if (profile?.familyId) notifyListUpdate(profile.familyId);
  return { success: true };
}

export async function clearCheckedItems(): Promise<{
  success: boolean;
  error?: string;
}> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'Nie jesteś zalogowany' };
  }

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId) {
    return { success: false, error: 'Nie należysz do rodziny' };
  }

  await db
    .delete(shoppingItems)
    .where(
      and(
        eq(shoppingItems.familyId, profile.familyId),
        eq(shoppingItems.isChecked, true),
      ),
    );

  revalidatePath('/');
  notifyListUpdate(profile.familyId);
  return { success: true };
}
