import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, unauthorized } from '@/lib/api/auth';
import { buildCategoryById, toApiItem } from '@/lib/api/serialize';
import { getShoppingList } from '@/lib/shopping/service';

export async function GET(request: NextRequest) {
  const ctx = await authenticateApiKey(request);
  if (!ctx) return unauthorized();

  const { items, categories, memberNames } = await getShoppingList(
    ctx.familyId,
  );
  const categoryById = buildCategoryById(categories);

  return NextResponse.json({
    family_id: ctx.familyId,
    items: items.map((item) => toApiItem(item, categoryById, memberNames)),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
    })),
  });
}
