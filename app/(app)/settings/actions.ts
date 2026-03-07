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

export type UpdatePasswordState = {
  error: string | null;
  success: boolean;
};

export async function updatePassword(
  _prevState: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const password = (formData.get('password') as string)?.trim();
  const confirmPassword = (formData.get('confirmPassword') as string)?.trim();

  if (!password) {
    return { error: 'Podaj nowe haslo.', success: false };
  }

  if (password.length < 6) {
    return { error: 'Haslo musi miec minimum 6 znakow.', success: false };
  }

  if (password !== confirmPassword) {
    return { error: 'Hasla nie sa identyczne.', success: false };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      error: 'Nie udalo sie zmienic hasla. Sprobuj ponownie.',
      success: false,
    };
  }

  return { error: null, success: true };
}

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
