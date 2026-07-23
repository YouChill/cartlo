import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, unauthorized } from '@/lib/api/auth';
import { buildCategoryById, toApiItem } from '@/lib/api/serialize';
import { parseJsonBody, validateItemInput } from '@/lib/api/validate';
import {
  bulkAddShoppingItems,
  getFamilyCategories,
  getMemberNames,
  type BulkItemInput,
} from '@/lib/shopping/service';

const MAX_BULK_ITEMS = 100;

export async function POST(request: NextRequest) {
  const ctx = await authenticateApiKey(request);
  if (!ctx) return unauthorized();

  const body = await parseJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json(
      { error: 'items must be a non-empty array' },
      { status: 400 },
    );
  }
  if (body.items.length > MAX_BULK_ITEMS) {
    return NextResponse.json(
      { error: `items must contain at most ${MAX_BULK_ITEMS} entries` },
      { status: 400 },
    );
  }

  const inputs: BulkItemInput[] = [];
  for (let i = 0; i < body.items.length; i++) {
    const entry = body.items[i];
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return NextResponse.json(
        { error: `items[${i}] must be an object` },
        { status: 400 },
      );
    }
    const validated = validateItemInput(entry as Record<string, unknown>);
    if (!validated.ok) {
      return NextResponse.json(
        { error: `items[${i}]: ${validated.error}` },
        { status: 400 },
      );
    }
    inputs.push({
      productName: validated.value.productName,
      categoryName: validated.value.categoryName,
      quantity: validated.value.quantity,
      unit: validated.value.unit,
    });
  }

  const { added, skipped } = await bulkAddShoppingItems({
    familyId: ctx.familyId,
    profileId: ctx.agentProfileId,
    items: inputs,
  });

  const [cats, memberNames] = await Promise.all([
    getFamilyCategories(ctx.familyId),
    getMemberNames(ctx.familyId),
  ]);
  const categoryById = buildCategoryById(cats);

  return NextResponse.json(
    {
      added: added.length,
      skipped,
      items: added.map((item) => toApiItem(item, categoryById, memberNames)),
    },
    { status: 201 },
  );
}
