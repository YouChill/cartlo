'use server';

import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function regenerateInviteCode() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Nie jestes zalogowany.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('family_id')
    .eq('id', user.id)
    .single();

  if (!profile?.family_id) {
    return { error: 'Nie nalezysz do zadnej rodziny.' };
  }

  const newCode = nanoid(8);

  const { error } = await supabase
    .from('families')
    .update({ invite_code: newCode })
    .eq('id', profile.family_id);

  if (error) {
    return { error: 'Nie udalo sie wygenerowac nowego kodu.' };
  }

  revalidatePath('/family');
  return { error: null };
}
