import { and, eq, or, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';

/**
 * Returns true if `categoryId` is either a global category (family_id IS NULL)
 * or one owned by `familyId`. Use before writing a client-supplied category id
 * onto any tenant-scoped row (shopping items, products, template items) so a
 * user cannot attach another family's private category to their data — and so
 * that later reads which filter categories by tenant don't silently hide the
 * row.
 */
export async function isCategoryVisibleToFamily(
  categoryId: string,
  familyId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(
      and(
        eq(categories.id, categoryId),
        or(isNull(categories.familyId), eq(categories.familyId, familyId)),
      ),
    )
    .limit(1);

  return Boolean(row);
}
