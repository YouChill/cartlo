'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export type UpdateProfileState = {
  error: string | null;
  success: boolean;
};

export async function updateDisplayName(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const displayName = (formData.get('displayName') as string)?.trim();

  if (!displayName) {
    return { error: 'Podaj swoje imie.', success: false };
  }

  if (displayName.length < 2) {
    return { error: 'Imie musi miec minimum 2 znaki.', success: false };
  }

  if (displayName.length > 30) {
    return { error: 'Imie moze miec maksymalnie 30 znakow.', success: false };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', user.id);

  if (error) {
    return {
      error: 'Nie udalo sie zaktualizowac imienia. Sprobuj ponownie.',
      success: false,
    };
  }

  revalidatePath('/', 'layout');
  return { error: null, success: true };
}
