import { createHash, randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { apiKeys } from '@/lib/db/schema';

export const API_KEY_PREFIX = 'cartlo_sk_';

export type ApiKeyContext = {
  keyId: string;
  familyId: string;
  agentProfileId: string;
};

export function generateApiKeyString(): string {
  return API_KEY_PREFIX + randomBytes(32).toString('base64url');
}

/**
 * SHA-256 (not bcrypt) so the hash is deterministic and the key can be found
 * via the unique index in O(1). The secret carries 256 random bits, so
 * brute-forcing the hash is infeasible.
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Authenticate an agent request via `Authorization: Bearer cartlo_sk_...`.
 * Returns null for missing/unknown/revoked keys.
 */
export async function authenticateApiKey(
  request: NextRequest,
): Promise<ApiKeyContext | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const key = authHeader.slice('Bearer '.length).trim();
  if (!key.startsWith(API_KEY_PREFIX)) return null;

  const [row] = await db
    .select({
      id: apiKeys.id,
      familyId: apiKeys.familyId,
      agentProfileId: apiKeys.agentProfileId,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, hashApiKey(key)), isNull(apiKeys.revokedAt)))
    .limit(1);

  if (!row) return null;

  // Fire-and-forget — auth must not fail or slow down on bookkeeping
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.id))
    .then(
      () => {},
      () => {},
    );

  return {
    keyId: row.id,
    familyId: row.familyId,
    agentProfileId: row.agentProfileId,
  };
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
