'use server';

import { revalidatePath } from 'next/cache';
import { eq, and, or, isNull, ilike, desc, sql } from 'drizzle-orm';
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
    return { success: false, error: 'Nie jestes zalogowany' };
  }

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  await db
    .update(shoppingItems)
    .set({
      isChecked,
      checkedBy: isChecked ? userId : null,
      checkedAt: isChecked ? new Date() : null,
    })
    .where(eq(shoppingItems.id, itemId));

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
            .where(sql`${products.id} IN ${semanticIds}`);
        }
      }
    } catch {
      // Semantic search failed — return ILIKE results only
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
      .where(sql`${categories.id} IN ${categoryIds}`);

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
): Promise<{ success: boolean; error?: string }> {
  const trimmed = productName.trim();
  if (!trimmed) {
    return { success: false, error: 'Nazwa produktu nie moze byc pusta' };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'Nie jestes zalogowany' };
  }

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId) {
    return { success: false, error: 'Nie nalezysz do rodziny' };
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
    return { success: false, error: 'Ten produkt juz jest na liscie' };
  }

  // Determine category: use known category if provided, otherwise auto-detect
  let categoryId: string | null = knownCategoryId ?? null;

  if (knownCategoryId === undefined) {
    // Look up product in products table for auto-categorization
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
          or(
            isNull(products.familyId),
            eq(products.familyId, profile.familyId),
          ),
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
            profile.familyId,
            { threshold: 0.8, limit: 1, requireCategory: true },
          );

          if (similar.length > 0 && similar[0].categoryId) {
            embeddingCategoryId = similar[0].categoryId;
          }
        } catch {
          // Embedding generation failed — fall back to uncategorized
        }
      }

      categoryId = embeddingCategoryId;

      // Add as new product (with embedding if available)
      const [newProduct] = await db
        .insert(products)
        .values({
          name: trimmed,
          categoryId,
          familyId: profile.familyId,
          usageCount: 1,
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
    }
  }

  // Insert shopping item
  await db.insert(shoppingItems).values({
    familyId: profile.familyId,
    productName: trimmed,
    categoryId,
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
    return { success: false, error: 'Nie jestes zalogowany' };
  }

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId) {
    return { success: false, error: 'Nie nalezysz do rodziny' };
  }

  // Update the shopping item's category
  await db
    .update(shoppingItems)
    .set({ categoryId })
    .where(eq(shoppingItems.id, itemId));

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
    const [newProduct] = await db
      .insert(products)
      .values({
        name: productName,
        categoryId,
        familyId: profile.familyId,
        usageCount: 1,
      })
      .returning({ id: products.id });

    // Generate embedding for new product (non-blocking)
    if (isEmbeddingConfigured() && newProduct) {
      upsertProductEmbedding(newProduct.id, productName).catch(() => {});
    }
  }

  revalidatePath('/');
  notifyListUpdate(profile.familyId);
  return { success: true };
}

export async function clearCheckedItems(): Promise<{
  success: boolean;
  error?: string;
}> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'Nie jestes zalogowany' };
  }

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId) {
    return { success: false, error: 'Nie nalezysz do rodziny' };
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
