'use server';

import { revalidatePath } from 'next/cache';
import { eq, and, asc, desc, or, isNull, ilike, sql } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  profiles,
  templates,
  templateItems,
  shoppingItems,
  products,
  categories,
} from '@/lib/db/schema';
import { notifyListUpdate } from '@/lib/pusher/server';

export type TemplateItemData = {
  id: string;
  product_name: string;
  category_id: string | null;
  category_name: string | null;
  category_icon: string | null;
  sort_order: number;
};

export type TemplateData = {
  id: string;
  name: string;
  created_at: string;
  items: TemplateItemData[];
};

export async function getTemplates(): Promise<TemplateData[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId) return [];

  const templatesList = await db
    .select({
      id: templates.id,
      name: templates.name,
      created_at: templates.createdAt,
    })
    .from(templates)
    .where(eq(templates.familyId, profile.familyId))
    .orderBy(asc(templates.createdAt));

  if (templatesList.length === 0) return [];

  const templateIds = templatesList.map((t) => t.id);

  const items = await db
    .select({
      id: templateItems.id,
      template_id: templateItems.templateId,
      product_name: templateItems.productName,
      category_id: templateItems.categoryId,
      sort_order: templateItems.sortOrder,
    })
    .from(templateItems)
    .where(sql`${templateItems.templateId} IN ${templateIds}`)
    .orderBy(asc(templateItems.sortOrder));

  const categoryIds = [
    ...new Set(items.map((i) => i.category_id).filter(Boolean)),
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

  return templatesList.map((t) => ({
    id: t.id,
    name: t.name,
    created_at: t.created_at.toISOString(),
    items: items
      .filter((i) => i.template_id === t.id)
      .map((i) => ({
        id: i.id,
        product_name: i.product_name,
        category_id: i.category_id,
        category_name: i.category_id
          ? (categoryMap[i.category_id]?.name ?? null)
          : null,
        category_icon: i.category_id
          ? (categoryMap[i.category_id]?.icon ?? null)
          : null,
        sort_order: i.sort_order,
      })),
  }));
}

export async function createTemplate(
  name: string,
): Promise<{ success: boolean; error?: string; id?: string }> {
  const trimmed = name.trim();
  if (!trimmed)
    return { success: false, error: 'Nazwa szablonu nie moze byc pusta' };

  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'Nie jestes zalogowany' };

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId)
    return { success: false, error: 'Nie nalezysz do rodziny' };

  const [template] = await db
    .insert(templates)
    .values({ familyId: profile.familyId, name: trimmed, createdBy: userId })
    .returning({ id: templates.id });

  revalidatePath('/templates');
  return { success: true, id: template.id };
}

export async function deleteTemplate(
  templateId: string,
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'Nie jestes zalogowany' };

  await db.delete(templates).where(eq(templates.id, templateId));

  revalidatePath('/templates');
  return { success: true };
}

export async function renameTemplate(
  templateId: string,
  name: string,
): Promise<{ success: boolean; error?: string }> {
  const trimmed = name.trim();
  if (!trimmed)
    return { success: false, error: 'Nazwa szablonu nie moze byc pusta' };

  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'Nie jestes zalogowany' };

  await db
    .update(templates)
    .set({ name: trimmed })
    .where(eq(templates.id, templateId));

  revalidatePath('/templates');
  return { success: true };
}

export async function addTemplateItem(
  templateId: string,
  productName: string,
  categoryId?: string | null,
): Promise<{ success: boolean; error?: string }> {
  const trimmed = productName.trim();
  if (!trimmed)
    return { success: false, error: 'Nazwa produktu nie moze byc pusta' };

  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'Nie jestes zalogowany' };

  let resolvedCategoryId = categoryId ?? null;

  if (categoryId === undefined) {
    const [profile] = await db
      .select({ familyId: profiles.familyId })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (profile?.familyId) {
      const [knownProduct] = await db
        .select({ categoryId: products.categoryId })
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
      resolvedCategoryId = knownProduct?.categoryId ?? null;
    }
  }

  const existingItems = await db
    .select({ sortOrder: templateItems.sortOrder })
    .from(templateItems)
    .where(eq(templateItems.templateId, templateId))
    .orderBy(desc(templateItems.sortOrder))
    .limit(1);

  const nextSortOrder = (existingItems[0]?.sortOrder ?? -1) + 1;

  await db.insert(templateItems).values({
    templateId,
    productName: trimmed,
    categoryId: resolvedCategoryId,
    sortOrder: nextSortOrder,
  });

  revalidatePath('/templates');
  return { success: true };
}

export async function removeTemplateItem(
  itemId: string,
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'Nie jestes zalogowany' };

  await db.delete(templateItems).where(eq(templateItems.id, itemId));

  revalidatePath('/templates');
  return { success: true };
}

export async function useTemplate(templateId: string): Promise<{
  success: boolean;
  error?: string;
  added?: number;
  skipped?: number;
}> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'Nie jestes zalogowany' };

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId)
    return { success: false, error: 'Nie nalezysz do rodziny' };

  const items = await db
    .select({
      productName: templateItems.productName,
      categoryId: templateItems.categoryId,
    })
    .from(templateItems)
    .where(eq(templateItems.templateId, templateId))
    .orderBy(asc(templateItems.sortOrder));

  if (items.length === 0)
    return { success: false, error: 'Szablon jest pusty' };

  const activeItems = await db
    .select({ productName: shoppingItems.productName })
    .from(shoppingItems)
    .where(
      and(
        eq(shoppingItems.familyId, profile.familyId),
        eq(shoppingItems.isChecked, false),
      ),
    );

  const activeNames = new Set(
    activeItems.map((i) => i.productName.toLowerCase()),
  );

  const toInsert = items.filter(
    (item) => !activeNames.has(item.productName.toLowerCase()),
  );

  if (toInsert.length === 0) {
    return {
      success: false,
      error: 'Wszystkie produkty z szablonu sa juz na liscie',
    };
  }

  await db.insert(shoppingItems).values(
    toInsert.map((item) => ({
      familyId: profile.familyId!,
      productName: item.productName,
      categoryId: item.categoryId,
      addedBy: userId,
    })),
  );

  revalidatePath('/');
  revalidatePath('/templates');
  notifyListUpdate(profile.familyId);

  return { success: true, added: toInsert.length, skipped: items.length - toInsert.length };
}
