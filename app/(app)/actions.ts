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
