'use server';

import { revalidatePath } from 'next/cache';
import { eq, and, or, isNull, ilike, desc, inArray } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles, shoppingItems, products, categories } from '@/lib/db/schema';
import { isCategoryVisibleToFamily } from '@/lib/db/scope';
import { notifyListUpdate } from '@/lib/pusher/server';
import { addShoppingItem, updateShoppingItem } from '@/lib/shopping/service';
import {
  generateEmbedding,
  findSimilarProducts,
  isEmbeddingConfigured,
  upsertProductEmbedding,
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

  await updateShoppingItem({
    familyId: profile.familyId,
    itemId,
    patch: { isChecked },
    actorProfileId: userId,
  });

  revalidatePath('/');
  return { success: true };
}

export type ProductSuggestion = {
  id: string;
  name: string;
  category_id: string | null;
  category_name: string | null;
  category_icon: string | null;
};

export async function searchProducts(
  query: string,
): Promise<ProductSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const userId = await getCurrentUserId();
  if (!userId) return [];

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId) return [];

  // Search products by name (case-insensitive)
  const matchedProducts = await db
    .select({
      id: products.id,
      name: products.name,
      categoryId: products.categoryId,
      usageCount: products.usageCount,
    })
    .from(products)
    .where(
      and(
        ilike(products.name, `%${trimmed}%`),
        or(isNull(products.familyId), eq(products.familyId, profile.familyId)),
      ),
    )
    .orderBy(desc(products.usageCount))
    .limit(8);

  // If ILIKE returned fewer than 3 results, supplement with semantic search
  let semanticProducts: typeof matchedProducts = [];
  if (matchedProducts.length < 3 && isEmbeddingConfigured()) {
    try {
      const queryEmbedding = await generateEmbedding(trimmed);
      const similar = await findSimilarProducts(
        queryEmbedding,
        profile.familyId,
        { threshold: 0.7, limit: 8 - matchedProducts.length },
      );

      if (similar.length > 0) {
        // Filter out products already found by ILIKE
        const existingIds = new Set(matchedProducts.map((p) => p.id));
        const newSimilar = similar.filter((s) => !existingIds.has(s.id));

        if (newSimilar.length > 0) {
          // Fetch full product info for semantic results
          const semanticIds = newSimilar.map((s) => s.id);
          semanticProducts = await db
            .select({
              id: products.id,
              name: products.name,
              categoryId: products.categoryId,
              usageCount: products.usageCount,
            })
            .from(products)
            .where(inArray(products.id, semanticIds));
        }
      }
    } catch (err) {
      console.error('[searchProducts] Semantic search failed:', err);
    }
  }

  const allProducts = [...matchedProducts, ...semanticProducts];

  if (allProducts.length === 0) return [];

  // Fetch category names for matched products
  const categoryIds = [
    ...new Set(allProducts.map((p) => p.categoryId).filter(Boolean)),
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

  return allProducts.map((p) => ({
    id: p.id,
    name: p.name,
    category_id: p.categoryId,
    category_name: p.categoryId
      ? (categoryMap[p.categoryId]?.name ?? null)
      : null,
    category_icon: p.categoryId
      ? (categoryMap[p.categoryId]?.icon ?? null)
      : null,
  }));
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

  // If the client supplied a category, it must be global or owned by this
  // family — otherwise drop it (auto-categorization will run instead).
  let categoryId = knownCategoryId;
  if (
    categoryId &&
    !(await isCategoryVisibleToFamily(categoryId, profile.familyId))
  ) {
    categoryId = null;
  }

  const result = await addShoppingItem({
    familyId: profile.familyId,
    profileId: userId,
    productName: trimmed,
    quantity,
    unit,
    categoryId,
  });

  if (!result.ok) {
    return { success: false, error: 'Ten produkt już jest na liście' };
  }

  revalidatePath('/');
  return { success: true };
}

export async function classifyProduct(
  itemId: string,
  _productName: string,
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

  // The target category must be global or owned by this family — never accept
  // a foreign family's private category id from the client.
  if (!(await isCategoryVisibleToFamily(categoryId, profile.familyId))) {
    return { success: false, error: 'Nieprawidłowa kategoria' };
  }

  // Verify the item belongs to this family and read its real name from the DB
  // (do not trust the client-supplied name — it drives what we "teach").
  const [item] = await db
    .select({ productName: shoppingItems.productName })
    .from(shoppingItems)
    .where(
      and(
        eq(shoppingItems.id, itemId),
        eq(shoppingItems.familyId, profile.familyId),
      ),
    )
    .limit(1);

  if (!item) {
    return { success: false, error: 'Element nie istnieje' };
  }

  const productName = item.productName;

  // Update the shopping item's category
  await db
    .update(shoppingItems)
    .set({ categoryId })
    .where(
      and(
        eq(shoppingItems.id, itemId),
        eq(shoppingItems.familyId, profile.familyId),
      ),
    );

  // Teach the system for future auto-categorization. Always write a
  // FAMILY-SCOPED product override — never mutate a global (family_id IS NULL)
  // product, which would change categorization for every other family.
  try {
    const [upserted] = await db
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

    // Generate/refresh embedding for this product (non-blocking)
    if (isEmbeddingConfigured() && upserted) {
      upsertProductEmbedding(upserted.id, productName).catch(() => {});
    }
  } catch {
    // Product teaching failed — the shopping item was already reclassified
    // above, so the user-facing action still succeeded.
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

  if (!profile?.familyId) {
    return { success: false, error: 'Nie należysz do rodziny' };
  }

  await updateShoppingItem({
    familyId: profile.familyId,
    itemId,
    patch: { quantity: newQuantity },
    actorProfileId: userId,
  });

  revalidatePath('/');
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
