import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, unauthorized } from '@/lib/api/auth';
import { buildCategoryById, toApiItem } from '@/lib/api/serialize';
import {
  parseJsonBody,
  validateQuantity,
  validateUnit,
  UUID_REGEX,
} from '@/lib/api/validate';
import {
  buildCategoryNameIndex,
  deleteShoppingItem,
  getFamilyCategories,
  getMemberNames,
  matchCategoryByName,
  updateShoppingItem,
  type UpdateItemPatch,
} from '@/lib/shopping/service';

const notFound = () =>
  NextResponse.json({ error: 'Item not found' }, { status: 404 });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await authenticateApiKey(request);
  if (!ctx) return unauthorized();

  const { id } = await params;
  // Bad UUID gets the same 404 as another family's item — no existence leak
  if (!UUID_REGEX.test(id)) return notFound();

  const body = await parseJsonBody(request);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const patch: UpdateItemPatch = {};

  if (body.product_name !== undefined) {
    if (
      typeof body.product_name !== 'string' ||
      body.product_name.trim().length === 0
    ) {
      return NextResponse.json(
        { error: 'product_name must be a non-empty string' },
        { status: 400 },
      );
    }
    if (body.product_name.trim().length > 100) {
      return NextResponse.json(
        { error: 'product_name must be at most 100 characters' },
        { status: 400 },
      );
    }
    patch.productName = body.product_name.trim();
  }

  if (body.quantity !== undefined) {
    const quantityError = validateQuantity(body.quantity);
    if (quantityError) {
      return NextResponse.json({ error: quantityError }, { status: 400 });
    }
    patch.quantity = body.quantity as number;
  }

  if (body.unit !== undefined) {
    const unitError = validateUnit(body.unit);
    if (unitError) {
      return NextResponse.json({ error: unitError }, { status: 400 });
    }
    patch.unit = body.unit as string;
  }

  if (body.is_checked !== undefined) {
    if (typeof body.is_checked !== 'boolean') {
      return NextResponse.json(
        { error: 'is_checked must be a boolean' },
        { status: 400 },
      );
    }
    patch.isChecked = body.is_checked;
  }

  const cats = await getFamilyCategories(ctx.familyId);

  if (body.category !== undefined) {
    if (body.category === null) {
      patch.categoryId = null;
    } else if (typeof body.category !== 'string') {
      return NextResponse.json(
        { error: 'category must be a string or null' },
        { status: 400 },
      );
    } else {
      // Unknown category name → uncategorized, not an error
      patch.categoryId =
        matchCategoryByName(buildCategoryNameIndex(cats), body.category)?.id ??
        null;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      {
        error:
          'At least one of product_name, quantity, unit, category, is_checked is required',
      },
      { status: 400 },
    );
  }

  const item = await updateShoppingItem({
    familyId: ctx.familyId,
    itemId: id,
    patch,
    actorProfileId: ctx.agentProfileId,
  });

  if (!item) return notFound();

  const memberNames = await getMemberNames(ctx.familyId);
  return NextResponse.json({
    item: toApiItem(item, buildCategoryById(cats), memberNames),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await authenticateApiKey(request);
  if (!ctx) return unauthorized();

  const { id } = await params;
  if (!UUID_REGEX.test(id)) return notFound();

  const deleted = await deleteShoppingItem({
    familyId: ctx.familyId,
    itemId: id,
  });

  if (!deleted) return notFound();

  return NextResponse.json({ deleted: true });
}
