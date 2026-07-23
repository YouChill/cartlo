import { MAX_QUANTITY, VALID_UNITS } from '@/lib/shopping/service';

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ItemInput = {
  productName: string;
  quantity?: number;
  unit?: string;
  categoryName?: string | null;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/**
 * Validate the shared item payload shape used by POST /items and each entry
 * of POST /items/bulk: { product_name, quantity?, unit?, category? }.
 */
export function validateItemInput(
  body: Record<string, unknown>,
): ValidationResult<ItemInput> {
  const rawName = body.product_name;
  if (typeof rawName !== 'string' || rawName.trim().length === 0) {
    return { ok: false, error: 'product_name is required' };
  }
  const productName = rawName.trim();
  if (productName.length > 100) {
    return { ok: false, error: 'product_name must be at most 100 characters' };
  }

  const result: ItemInput = { productName };

  if (body.quantity !== undefined) {
    const quantityError = validateQuantity(body.quantity);
    if (quantityError) return { ok: false, error: quantityError };
    result.quantity = body.quantity as number;
  }

  if (body.unit !== undefined) {
    const unitError = validateUnit(body.unit);
    if (unitError) return { ok: false, error: unitError };
    result.unit = body.unit as string;
  }

  if (body.category !== undefined && body.category !== null) {
    if (typeof body.category !== 'string') {
      return { ok: false, error: 'category must be a string' };
    }
    result.categoryName = body.category.trim() || null;
  }

  return { ok: true, value: result };
}

export function validateQuantity(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'quantity must be a number';
  }
  if (value <= 0 || value > MAX_QUANTITY) {
    return `quantity must be greater than 0 and at most ${MAX_QUANTITY}`;
  }
  return null;
}

export function validateUnit(value: unknown): string | null {
  if (
    typeof value !== 'string' ||
    !(VALID_UNITS as readonly string[]).includes(value)
  ) {
    return `unit must be one of: ${VALID_UNITS.join(', ')}`;
  }
  return null;
}

/** Parse a request body as a JSON object; returns null on invalid JSON. */
export async function parseJsonBody(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return null;
    }
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}
