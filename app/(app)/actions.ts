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
