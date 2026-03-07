'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { families, profiles } from '@/lib/db/schema';

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

  const userId = await getCurrentUserId();
  if (!userId) {
    redirect(`/login?join=${code}`);
  }

  // Check if user already has a family
  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (profile?.familyId) {
    return {
      error: 'Juz nalezysz do rodziny.',
      success: false,
      familyName: null,
    };
  }

  // Validate invite code
  const [family] = await db
    .select({ id: families.id, name: families.name })
    .from(families)
    .where(eq(families.inviteCode, code))
    .limit(1);

  if (!family) {
    return {
      error: 'Nieprawidlowy kod zaproszeniowy.',
      success: false,
      familyName: null,
    };
  }

  // Join the family
  await db
    .update(profiles)
    .set({ familyId: family.id, displayName })
    .where(eq(profiles.id, userId));

  return {
    error: null,
    success: true,
    familyName: family.name,
  };
}
