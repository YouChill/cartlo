'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function toggleShoppingItem(
  itemId: string,
  isChecked: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Nie jestes zalogowany' };
  }

  const { error } = await supabase
    .from('shopping_items')
    .update({
      is_checked: isChecked,
      checked_by: isChecked ? user.id : null,
      checked_at: isChecked ? new Date().toISOString() : null,
    })
    .eq('id', itemId);

  if (error) {
    return { success: false, error: 'Nie udalo sie zaktualizowac pozycji' };
  }

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

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: profile } = await supabase
    .from('profiles')
    .select('family_id')
    .eq('id', user.id)
    .single();

  if (!profile?.family_id) return [];

  // Search products by name (case-insensitive)
  const { data: products } = await supabase
    .from('products')
    .select('id, name, category_id, usage_count')
    .or(`family_id.is.null,family_id.eq.${profile.family_id}`)
    .ilike('name', `%${trimmed}%`)
    .order('usage_count', { ascending: false })
    .limit(8);

  if (!products || products.length === 0) return [];

  // Fetch category names for matched products
  const categoryIds = [
    ...new Set(products.map((p) => p.category_id).filter(Boolean)),
  ] as string[];

  let categoryMap: Record<string, { name: string; icon: string }> = {};
  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, icon')
      .in('id', categoryIds);

    if (categories) {
      categories.forEach((c) => {
        categoryMap[c.id] = { name: c.name, icon: c.icon };
      });
    }
  }

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    category_id: p.category_id,
    category_name: p.category_id ? (categoryMap[p.category_id]?.name ?? null) : null,
    category_icon: p.category_id ? (categoryMap[p.category_id]?.icon ?? null) : null,
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

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Nie jestes zalogowany' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('family_id')
    .eq('id', user.id)
    .single();

  if (!profile?.family_id) {
    return { success: false, error: 'Nie nalezysz do rodziny' };
  }

  // Check for duplicates on active list
  const { data: existing } = await supabase
    .from('shopping_items')
    .select('id')
    .eq('family_id', profile.family_id)
    .eq('is_checked', false)
    .ilike('product_name', trimmed)
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: false, error: 'Ten produkt juz jest na liscie' };
  }

  // Determine category: use known category if provided, otherwise auto-detect
  let categoryId: string | null = knownCategoryId ?? null;

  if (knownCategoryId === undefined) {
    // Look up product in products table for auto-categorization
    const { data: knownProduct } = await supabase
      .from('products')
      .select('id, category_id')
      .ilike('name', trimmed)
      .or(`family_id.is.null,family_id.eq.${profile.family_id}`)
      .limit(1)
      .single();

    if (knownProduct) {
      categoryId = knownProduct.category_id;
      // usage_count increment will be handled in issue #34
    } else {
      // Add as new product (uncategorized)
      await supabase.from('products').insert({
        name: trimmed,
        category_id: null,
        family_id: profile.family_id,
        usage_count: 1,
      });
    }
  }

  // Insert shopping item
  const { error } = await supabase.from('shopping_items').insert({
    family_id: profile.family_id,
    product_name: trimmed,
    category_id: categoryId,
    added_by: user.id,
  });

  if (error) {
    return { success: false, error: 'Nie udalo sie dodac produktu' };
  }

  revalidatePath('/');
  return { success: true };
}

export async function clearCheckedItems(): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Nie jestes zalogowany' };
  }

  // Get user's family_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('family_id')
    .eq('id', user.id)
    .single();

  if (!profile?.family_id) {
    return { success: false, error: 'Nie nalezysz do rodziny' };
  }

  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('family_id', profile.family_id)
    .eq('is_checked', true);

  if (error) {
    return { success: false, error: 'Nie udalo sie usunac pozycji' };
  }

  revalidatePath('/');
  return { success: true };
}
