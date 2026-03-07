import { redirect } from 'next/navigation';
import { eq, asc } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles, families } from '@/lib/db/schema';
import { FamilyClient } from './family-client';

export const metadata = {
  title: 'Rodzina — Cartlo',
};

export default async function FamilyPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  // Get current user's profile
  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId) redirect('/onboarding');

  // Get family info
  const [family] = await db
    .select({
      id: families.id,
      name: families.name,
      invite_code: families.inviteCode,
      created_at: families.createdAt,
    })
    .from(families)
    .where(eq(families.id, profile.familyId))
    .limit(1);

  if (!family) redirect('/onboarding');

  // Get all family members
  const members = await db
    .select({
      id: profiles.id,
      display_name: profiles.displayName,
      created_at: profiles.createdAt,
    })
    .from(profiles)
    .where(eq(profiles.familyId, family.id))
    .orderBy(asc(profiles.createdAt));

  return (
    <FamilyClient
      family={{
        ...family,
        created_at: family.created_at.toISOString(),
      }}
      members={members.map((m) => ({
        ...m,
        created_at: m.created_at.toISOString(),
      }))}
      currentUserId={userId}
    />
  );
}
