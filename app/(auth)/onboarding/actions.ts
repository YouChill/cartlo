'use server';

import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';
import { eq, ilike } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { families, profiles } from '@/lib/db/schema';

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

  const userId = await getCurrentUserId();
  if (!userId) {
    redirect('/login');
  }

  // Check for duplicate family name (case-insensitive)
  const [existing] = await db
    .select({ id: families.id })
    .from(families)
    .where(ilike(families.name, familyName))
    .limit(1);

  if (existing) {
    return {
      error: 'Rodzina o tej nazwie już istnieje.',
      inviteCode: null,
      familyName: null,
    };
  }

  // Generate unique invite code (8 chars, url-safe)
  const inviteCode = nanoid(8);

  // Create family
  const [family] = await db
    .insert(families)
    .values({ name: familyName, inviteCode })
    .returning({ id: families.id });

  if (!family) {
    return {
      error: 'Nie udalo sie utworzyc rodziny. Sprobuj ponownie.',
      inviteCode: null,
      familyName: null,
    };
  }

  // Update profile: assign family_id and display_name
  await db
    .update(profiles)
    .set({ familyId: family.id, displayName })
    .where(eq(profiles.id, userId));

  return {
    error: null,
    inviteCode,
    familyName,
  };
}
