'use server';

import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles, families } from '@/lib/db/schema';

export async function regenerateInviteCode() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { error: 'Nie jestes zalogowany.' };
  }

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId) {
    return { error: 'Nie nalezysz do zadnej rodziny.' };
  }

  const newCode = nanoid(8);

  await db
    .update(families)
    .set({ inviteCode: newCode })
    .where(eq(families.id, profile.familyId));

  revalidatePath('/family');
  return { error: null };
}
