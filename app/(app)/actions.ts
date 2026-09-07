'use server';

import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles, shoppingItems, products } from '@/lib/db/schema';
import { isCategoryVisibleToFamily } from '@/lib/db/scope';
import { notifyListUpdate } from '@/lib/pusher/server';
import { addShoppingItem, updateShoppingItem } from '@/lib/shopping/service';
import {
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

// The suggestion shape lives with the search implementation now; the
// autocomplete itself is served by GET /api/products/search (a route handler
// is parallel and abortable, unlike a per-keystroke server action).
export type { ProductSuggestion } from '@/lib/shopping/product-search';

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
