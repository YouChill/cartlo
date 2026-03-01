'use server';

import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';
import { createClient } from '@/lib/supabase/server';

export type OnboardingFormState = {
  error: string | null;
  inviteCode: string | null;
  familyName: string | null;
};

export async function createFamily(
  _prevState: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const familyName = (formData.get('familyName') as string)?.trim();
  const displayName = (formData.get('displayName') as string)?.trim();

  if (!familyName) {
    return {
      error: 'Podaj nazwe rodziny.',
      inviteCode: null,
      familyName: null,
    };
  }

  if (!displayName) {
    return { error: 'Podaj swoje imie.', inviteCode: null, familyName: null };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Generate unique invite code (8 chars, url-safe)
  const inviteCode = nanoid(8);

  // Create family
  const { data: family, error: familyError } = await supabase
    .from('families')
    .insert({ name: familyName, invite_code: inviteCode })
    .select('id')
    .single();

  if (familyError || !family) {
    return {
      error: 'Nie udalo sie utworzyc rodziny. Sprobuj ponownie.',
      inviteCode: null,
      familyName: null,
    };
  }

  // Update profile: assign family_id and display_name
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ family_id: family.id, display_name: displayName })
    .eq('id', user.id);

  if (profileError) {
    return {
      error: 'Nie udalo sie przypisac do rodziny. Sprobuj ponownie.',
      inviteCode: null,
      familyName: null,
    };
  }

  return {
    error: null,
    inviteCode,
    familyName,
  };
}
