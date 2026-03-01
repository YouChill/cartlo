'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type JoinFormState = {
  error: string | null;
  success: boolean;
  familyName: string | null;
};

export async function joinFamily(
  _prevState: JoinFormState,
  formData: FormData,
): Promise<JoinFormState> {
  const code = (formData.get('code') as string)?.trim();
  const displayName = (formData.get('displayName') as string)?.trim();

  if (!code) {
    return {
      error: 'Brak kodu zaproszeniowego.',
      success: false,
      familyName: null,
    };
  }

  if (!displayName) {
    return { error: 'Podaj swoje imie.', success: false, familyName: null };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?join=${code}`);
  }

  // Check if user already has a family
  const { data: profile } = await supabase
    .from('profiles')
    .select('family_id')
    .eq('id', user.id)
    .single();

  if (profile?.family_id) {
    return {
      error: 'Juz nalezysz do rodziny.',
      success: false,
      familyName: null,
    };
  }

  // Validate invite code
  const { data: family } = await supabase
    .from('families')
    .select('id, name')
    .eq('invite_code', code)
    .single();

  if (!family) {
    return {
      error: 'Nieprawidlowy kod zaproszeniowy.',
      success: false,
      familyName: null,
    };
  }

  // Join the family
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ family_id: family.id, display_name: displayName })
    .eq('id', user.id);

  if (updateError) {
    return {
      error: 'Nie udalo sie dolaczyc do rodziny. Sprobuj ponownie.',
      success: false,
      familyName: null,
    };
  }

  return {
    error: null,
    success: true,
    familyName: family.name,
  };
}
