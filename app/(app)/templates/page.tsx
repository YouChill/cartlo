import { redirect } from 'next/navigation';
import { eq, or, isNull, asc } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles, categories } from '@/lib/db/schema';
import { getTemplates } from './actions';
import { TemplatesList } from '@/components/templates/templates-list';

export default async function TemplatesPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId) redirect('/onboarding');

  const [templatesList, cats] = await Promise.all([
    getTemplates(),
    db
      .select({
        id: categories.id,
        name: categories.name,
        icon: categories.icon,
        sort_order: categories.sortOrder,
      })
      .from(categories)
      .where(
        or(
          isNull(categories.familyId),
          eq(categories.familyId, profile.familyId),
        ),
      )
      .orderBy(asc(categories.sortOrder)),
  ]);

  return <TemplatesList initialTemplates={templatesList} categories={cats} />;
}
