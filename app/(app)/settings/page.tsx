import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles, users, families } from '@/lib/db/schema';
import { SettingsClient } from './settings-client';

export const metadata = {
  title: 'Ustawienia — Cartlo',
};

export default async function SettingsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) redirect('/login');

  const [profile] = await db
    .select({
      displayName: profiles.displayName,
      familyId: profiles.familyId,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId) redirect('/onboarding');

  const [family] = await db
    .select({ inviteCode: families.inviteCode })
    .from(families)
    .where(eq(families.id, profile.familyId))
    .limit(1);

  return (
    <SettingsClient
      displayName={profile.displayName}
      email={user.email}
      inviteCode={family?.inviteCode ?? ''}
    />
  );
}
