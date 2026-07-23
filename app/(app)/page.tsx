import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { getShoppingList } from '@/lib/shopping/service';
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

  const { items, categories, memberNames } = await getShoppingList(
    profile.familyId,
  );

  // Serialize for client components (snake_case props, dates as strings)
  const serializedItems = items.map((item) => ({
    id: item.id,
    product_name: item.productName,
    category_id: item.categoryId,
    quantity: item.quantity,
    unit: item.unit,
    is_checked: item.isChecked,
    added_by: item.addedBy,
    checked_by: item.checkedBy,
    checked_at: item.checkedAt?.toISOString() ?? null,
    created_at: item.createdAt.toISOString(),
  }));

  const serializedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    sort_order: c.sortOrder,
  }));

  return (
    <ShoppingList
      items={serializedItems}
      categories={serializedCategories}
      memberNames={memberNames}
      familyId={profile.familyId}
    />
  );
}
