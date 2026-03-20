import { redirect } from 'next/navigation';
import { eq, or, isNull, asc } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles, shoppingItems, categories, } from '@/lib/db/schema';
import { ShoppingList } from '@/components/shopping/shopping-list';

export default async function ListPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId) redirect('/onboarding');

  // Fetch shopping items for the family
  const items = await db
    .select({
      id: shoppingItems.id,
      product_name: shoppingItems.productName,
      category_id: shoppingItems.categoryId,
      quantity: shoppingItems.quantity,
      unit: shoppingItems.unit,
      is_checked: shoppingItems.isChecked,
      added_by: shoppingItems.addedBy,
      checked_by: shoppingItems.checkedBy,
      checked_at: shoppingItems.checkedAt,
      created_at: shoppingItems.createdAt,
    })
    .from(shoppingItems)
    .where(eq(shoppingItems.familyId, profile.familyId))
    .orderBy(asc(shoppingItems.createdAt));

  // Fetch categories
  const cats = await db
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
    .orderBy(asc(categories.sortOrder));

  // Fetch family member names for meta info
  const members = await db
    .select({ id: profiles.id, display_name: profiles.displayName })
    .from(profiles)
    .where(eq(profiles.familyId, profile.familyId));

  // Build member name lookup
  const memberNames: Record<string, string> = {};
  members.forEach((m) => {
    memberNames[m.id] = m.display_name;
  });

  // Serialize dates to strings for client components
  const serializedItems = items.map((item) => ({
    ...item,
    checked_at: item.checked_at?.toISOString() ?? null,
    created_at: item.created_at.toISOString(),
  }));

  return (
    <ShoppingList
      items={serializedItems}
      categories={cats}
      memberNames={memberNames}
      familyId={profile.familyId}
    />
  );
}
