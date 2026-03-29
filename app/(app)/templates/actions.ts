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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TemplateItemData = {
  id: string;
  product_name: string;
  category_id: string | null;
  category_name: string | null;
  category_icon: string | null;
  quantity: number;
  unit: string;
  sort_order: number;
};

export type TemplateData = {
  id: string;
  name: string;
  created_at: string;
  items: TemplateItemData[];
};

// ---------------------------------------------------------------------------
// Unit helpers – maps category icons to default units
// ---------------------------------------------------------------------------

const CATEGORY_UNIT_MAP: Record<string, string> = {
  // Weight-based categories
  Beef: 'g',
  Fish: 'g',
  // Piece-based (default)
  Apple: 'szt',
  Milk: 'szt',
  Croissant: 'szt',
  Snowflake: 'szt',
  CupSoda: 'szt',
  Cookie: 'szt',
  FlaskRound: 'szt',
  SprayCan: 'szt',
  ShowerHead: 'szt',
  Home: 'szt',
  Package: 'szt',
};

function getDefaultUnitForCategory(
  categoryIcon: string | null,
): string {
  if (!categoryIcon) return 'szt';
  return CATEGORY_UNIT_MAP[categoryIcon] ?? 'szt';
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

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
      quantity: templateItems.quantity,
      unit: templateItems.unit,
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
        quantity: parseFloat(i.quantity),
        unit: i.unit,
        sort_order: i.sort_order,
      })),
  }));
}

// ---------------------------------------------------------------------------
// Template CRUD
// ---------------------------------------------------------------------------

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

export async function duplicateTemplate(
  templateId: string,
): Promise<{ success: boolean; error?: string; template?: TemplateData }> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'Nie jestes zalogowany' };

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId)
    return { success: false, error: 'Nie nalezysz do rodziny' };

  // Fetch source template
  const [source] = await db
    .select({ id: templates.id, name: templates.name })
    .from(templates)
    .where(eq(templates.id, templateId))
    .limit(1);

  if (!source)
    return { success: false, error: 'Szablon nie istnieje' };

  // Create copy
  const [newTemplate] = await db
    .insert(templates)
    .values({
      familyId: profile.familyId,
      name: `${source.name} (kopia)`,
      createdBy: userId,
    })
    .returning({ id: templates.id, createdAt: templates.createdAt });

  // Copy items
  const sourceItems = await db
    .select({
      productName: templateItems.productName,
      categoryId: templateItems.categoryId,
      quantity: templateItems.quantity,
      unit: templateItems.unit,
      sortOrder: templateItems.sortOrder,
    })
    .from(templateItems)
    .where(eq(templateItems.templateId, templateId))
    .orderBy(asc(templateItems.sortOrder));

  if (sourceItems.length > 0) {
    await db.insert(templateItems).values(
      sourceItems.map((item) => ({
        templateId: newTemplate.id,
        productName: item.productName,
        categoryId: item.categoryId,
        quantity: item.quantity,
        unit: item.unit,
        sortOrder: item.sortOrder,
      })),
    );
  }

  // Fetch the new template's items with categories for the response
  const newItems = await db
    .select({
      id: templateItems.id,
      product_name: templateItems.productName,
      category_id: templateItems.categoryId,
      quantity: templateItems.quantity,
      unit: templateItems.unit,
      sort_order: templateItems.sortOrder,
    })
    .from(templateItems)
    .where(eq(templateItems.templateId, newTemplate.id))
    .orderBy(asc(templateItems.sortOrder));

  const categoryIds = [
    ...new Set(newItems.map((i) => i.category_id).filter(Boolean)),
  ] as string[];

  const categoryMap: Record<string, { name: string; icon: string }> = {};
  if (categoryIds.length > 0) {
    const cats = await db
      .select({ id: categories.id, name: categories.name, icon: categories.icon })
      .from(categories)
      .where(sql`${categories.id} IN ${categoryIds}`);
    cats.forEach((c) => {
      categoryMap[c.id] = { name: c.name, icon: c.icon };
    });
  }

  revalidatePath('/templates');
  return {
    success: true,
    template: {
      id: newTemplate.id,
      name: `${source.name} (kopia)`,
      created_at: newTemplate.createdAt.toISOString(),
      items: newItems.map((i) => ({
        id: i.id,
        product_name: i.product_name,
        category_id: i.category_id,
        category_name: i.category_id
          ? (categoryMap[i.category_id]?.name ?? null)
          : null,
        category_icon: i.category_id
          ? (categoryMap[i.category_id]?.icon ?? null)
          : null,
        quantity: parseFloat(i.quantity),
        unit: i.unit,
        sort_order: i.sort_order,
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Template Item CRUD
// ---------------------------------------------------------------------------

export async function addTemplateItem(
  templateId: string,
  productName: string,
  categoryId?: string | null,
): Promise<{
  success: boolean;
  error?: string;
  id?: string;
  unit?: string;
}> {
  const trimmed = productName.trim();
  if (!trimmed)
    return { success: false, error: 'Nazwa produktu nie moze byc pusta' };

  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'Nie jestes zalogowany' };

  let resolvedCategoryId = categoryId ?? null;
  let categoryIcon: string | null = null;

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

  // Resolve category icon for default unit detection
  if (resolvedCategoryId) {
    const [cat] = await db
      .select({ icon: categories.icon })
      .from(categories)
      .where(eq(categories.id, resolvedCategoryId))
      .limit(1);
    categoryIcon = cat?.icon ?? null;
  }

  const defaultUnit = getDefaultUnitForCategory(categoryIcon);

  const existingItems = await db
    .select({ sortOrder: templateItems.sortOrder })
    .from(templateItems)
    .where(eq(templateItems.templateId, templateId))
    .orderBy(desc(templateItems.sortOrder))
    .limit(1);

  const nextSortOrder = (existingItems[0]?.sortOrder ?? -1) + 1;

  const [inserted] = await db
    .insert(templateItems)
    .values({
      templateId,
      productName: trimmed,
      categoryId: resolvedCategoryId,
      quantity: '1',
      unit: defaultUnit,
      sortOrder: nextSortOrder,
    })
    .returning({ id: templateItems.id });

  revalidatePath('/templates');
  return { success: true, id: inserted.id, unit: defaultUnit };
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

export async function updateTemplateItem(
  itemId: string,
  data: {
    productName?: string;
    categoryId?: string | null;
    quantity?: number;
    unit?: string;
  },
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'Nie jestes zalogowany' };

  const updateSet: Record<string, unknown> = {};

  if (data.productName !== undefined) {
    const trimmed = data.productName.trim();
    if (!trimmed)
      return { success: false, error: 'Nazwa produktu nie moze byc pusta' };
    updateSet.productName = trimmed;

    // Auto-resolve category if not explicitly provided
    if (data.categoryId === undefined) {
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
        updateSet.categoryId = knownProduct?.categoryId ?? null;
      }
    }
  }

  if (data.categoryId !== undefined) {
    updateSet.categoryId = data.categoryId;
  }

  if (data.quantity !== undefined) {
    if (data.quantity <= 0)
      return { success: false, error: 'Ilosc musi byc wieksza od 0' };
    updateSet.quantity = data.quantity.toString();
  }

  if (data.unit !== undefined) {
    updateSet.unit = data.unit;
  }

  if (Object.keys(updateSet).length === 0) {
    return { success: true };
  }

  await db
    .update(templateItems)
    .set(updateSet)
    .where(eq(templateItems.id, itemId));

  revalidatePath('/templates');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Reorder items
// ---------------------------------------------------------------------------

export async function reorderTemplateItems(
  templateId: string,
  itemIds: string[],
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'Nie jestes zalogowany' };

  // Update sort_order for each item based on its position in the array
  const updates = itemIds.map((id, index) =>
    db
      .update(templateItems)
      .set({ sortOrder: index })
      .where(and(eq(templateItems.id, id), eq(templateItems.templateId, templateId))),
  );

  await Promise.all(updates);

  revalidatePath('/templates');
  return { success: true };
}

export async function sortTemplateItemsByCategory(
  templateId: string,
): Promise<{ success: boolean; error?: string; sortedIds?: string[] }> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'Nie jestes zalogowany' };

  // Fetch items with category info
  const items = await db
    .select({
      id: templateItems.id,
      productName: templateItems.productName,
      categoryId: templateItems.categoryId,
    })
    .from(templateItems)
    .where(eq(templateItems.templateId, templateId));

  if (items.length === 0) return { success: true, sortedIds: [] };

  // Fetch categories for sort order
  const categoryIds = [
    ...new Set(items.map((i) => i.categoryId).filter(Boolean)),
  ] as string[];

  const categoryMap: Record<string, { sortOrder: number; name: string }> = {};
  if (categoryIds.length > 0) {
    const cats = await db
      .select({
        id: categories.id,
        name: categories.name,
        sortOrder: categories.sortOrder,
      })
      .from(categories)
      .where(sql`${categories.id} IN ${categoryIds}`);
    cats.forEach((c) => {
      categoryMap[c.id] = { sortOrder: c.sortOrder, name: c.name };
    });
  }

  // Sort: by category sort_order, then alphabetically by product name
  // Items without category go to the end
  const sorted = [...items].sort((a, b) => {
    const catA = a.categoryId ? categoryMap[a.categoryId] : null;
    const catB = b.categoryId ? categoryMap[b.categoryId] : null;

    const orderA = catA?.sortOrder ?? 9999;
    const orderB = catB?.sortOrder ?? 9999;

    if (orderA !== orderB) return orderA - orderB;

    // Same category — sort alphabetically
    return a.productName.localeCompare(b.productName, 'pl');
  });

  const sortedIds = sorted.map((i) => i.id);

  // Update sort_order
  const updates = sortedIds.map((id, index) =>
    db
      .update(templateItems)
      .set({ sortOrder: index })
      .where(eq(templateItems.id, id)),
  );

  await Promise.all(updates);

  revalidatePath('/templates');
  return { success: true, sortedIds };
}

// ---------------------------------------------------------------------------
// Import template from JSON
// ---------------------------------------------------------------------------

export type ImportTemplateItem = {
  product_name: string;
  category?: string | null;
  quantity?: number;
  unit?: string;
};

export type ImportTemplatePayload = {
  name: string;
  items: ImportTemplateItem[];
};

export async function importTemplate(
  payload: ImportTemplatePayload,
): Promise<{ success: boolean; error?: string; template?: TemplateData }> {
  const name = payload.name?.trim();
  if (!name)
    return { success: false, error: 'Nazwa szablonu nie może być pusta' };

  if (!Array.isArray(payload.items) || payload.items.length === 0)
    return { success: false, error: 'Szablon musi zawierać przynajmniej jeden produkt' };

  const validUnits = new Set(['szt', 'g', 'kg', 'ml', 'l']);

  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'Nie jesteś zalogowany' };

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId)
    return { success: false, error: 'Nie należysz do rodziny' };

  // Fetch all categories for name matching
  const allCategories = await db
    .select({ id: categories.id, name: categories.name, icon: categories.icon })
    .from(categories)
    .where(
      or(
        isNull(categories.familyId),
        eq(categories.familyId, profile.familyId),
      ),
    );

  const categoryByName: Record<string, { id: string; name: string; icon: string }> = {};
  allCategories.forEach((c) => {
    categoryByName[c.name.toLowerCase()] = { id: c.id, name: c.name, icon: c.icon };
  });

  // Create template
  const [template] = await db
    .insert(templates)
    .values({ familyId: profile.familyId, name, createdBy: userId })
    .returning({ id: templates.id, createdAt: templates.createdAt });

  // Insert items
  const itemsToInsert = payload.items.map((item, index) => {
    const productName = item.product_name?.trim();
    if (!productName) return null;

    const matchedCategory = item.category
      ? categoryByName[item.category.toLowerCase()] ?? null
      : null;

    const unit = item.unit && validUnits.has(item.unit) ? item.unit : 'szt';
    const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;

    return {
      templateId: template.id,
      productName,
      categoryId: matchedCategory?.id ?? null,
      quantity: quantity.toString(),
      unit,
      sortOrder: index,
    };
  }).filter(Boolean) as {
    templateId: string;
    productName: string;
    categoryId: string | null;
    quantity: string;
    unit: string;
    sortOrder: number;
  }[];

  if (itemsToInsert.length > 0) {
    await db.insert(templateItems).values(itemsToInsert);
  }

  // Fetch inserted items for response
  const newItems = await db
    .select({
      id: templateItems.id,
      product_name: templateItems.productName,
      category_id: templateItems.categoryId,
      quantity: templateItems.quantity,
      unit: templateItems.unit,
      sort_order: templateItems.sortOrder,
    })
    .from(templateItems)
    .where(eq(templateItems.templateId, template.id))
    .orderBy(asc(templateItems.sortOrder));

  const categoryMap: Record<string, { name: string; icon: string }> = {};
  allCategories.forEach((c) => {
    categoryMap[c.id] = { name: c.name, icon: c.icon };
  });

  revalidatePath('/templates');
  return {
    success: true,
    template: {
      id: template.id,
      name,
      created_at: template.createdAt.toISOString(),
      items: newItems.map((i) => ({
        id: i.id,
        product_name: i.product_name,
        category_id: i.category_id,
        category_name: i.category_id
          ? (categoryMap[i.category_id]?.name ?? null)
          : null,
        category_icon: i.category_id
          ? (categoryMap[i.category_id]?.icon ?? null)
          : null,
        quantity: parseFloat(i.quantity),
        unit: i.unit,
        sort_order: i.sort_order,
      })),
    },
  };
}

// ---------------------------------------------------------------------------
// Use template (add to shopping list)
// ---------------------------------------------------------------------------

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
      quantity: templateItems.quantity,
      unit: templateItems.unit,
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

  // Format product name with quantity if > 1
  await db.insert(shoppingItems).values(
    toInsert.map((item) => {
      const qty = parseFloat(item.quantity);
      const displayName =
        qty > 1 || item.unit !== 'szt'
          ? `${item.productName} (${qty % 1 === 0 ? qty.toFixed(0) : qty} ${item.unit})`
          : item.productName;
      return {
        familyId: profile.familyId!,
        productName: displayName,
        categoryId: item.categoryId,
        addedBy: userId,
      };
    }),
  );

  revalidatePath('/');
  revalidatePath('/templates');
  notifyListUpdate(profile.familyId);

  return {
    success: true,
    added: toInsert.length,
    skipped: items.length - toInsert.length,
  };
}
