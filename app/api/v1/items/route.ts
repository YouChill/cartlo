import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, unauthorized } from '@/lib/api/auth';
import { buildCategoryById, toApiItem } from '@/lib/api/serialize';
import { parseJsonBody, validateItemInput } from '@/lib/api/validate';
import {
  addShoppingItem,
  buildCategoryNameIndex,
  getFamilyCategories,
  getMemberNames,
  matchCategoryByName,
} from '@/lib/shopping/service';

export async function POST(request: NextRequest) {
  const ctx = await authenticateApiKey(request);
  if (!ctx) return unauthorized();

  const body = await parseJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validated = validateItemInput(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }
  const input = validated.value;

  const cats = await getFamilyCategories(ctx.familyId);

  // Explicit category name: match it (unknown name → uncategorized, not an
  // error). No category field at all → auto-detect from the products table.
  let categoryId: string | null | undefined = undefined;
  if (input.categoryName !== undefined) {
    categoryId = input.categoryName
      ? (matchCategoryByName(buildCategoryNameIndex(cats), input.categoryName)
          ?.id ?? null)
      : null;
  }

  const result = await addShoppingItem({
    familyId: ctx.familyId,
    profileId: ctx.agentProfileId,
    productName: input.productName,
    quantity: input.quantity,
    unit: input.unit,
    categoryId,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: 'Item already on the list', item_id: result.itemId },
      { status: 409 },
    );
  }

  const memberNames = await getMemberNames(ctx.familyId);
  return NextResponse.json(
    { item: toApiItem(result.item, buildCategoryById(cats), memberNames) },
    { status: 201 },
  );
}
