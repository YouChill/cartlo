import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  generateEmbedding,
  findSimilarProducts,
  isEmbeddingConfigured,
} from '@/lib/embeddings';

export type ProductSuggestion = {
  id: string;
  name: string;
  category_id: string | null;
  category_name: string | null;
  category_icon: string | null;
};

/** Rows scanned before de-duplication — keeps the query bounded on big tables. */
const SCAN_LIMIT = 100;
export const DEFAULT_SUGGESTION_LIMIT = 8;

/** Escape LIKE wildcards so a typed "%" or "_" matches literally. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function toSuggestions(rows: Record<string, unknown>[]): ProductSuggestion[] {
  return (rows as unknown as ProductSuggestion[]).map((row) => ({
    id: row.id,
    name: row.name,
    category_id: row.category_id ?? null,
    category_name: row.category_name ?? null,
    category_icon: row.category_icon ?? null,
  }));
}

/**
 * Keyword ("fast path") product suggestions for one user.
 *
 * Everything happens in a single round trip: the family is resolved with a
 * sub-select instead of a separate profile query, categories are joined in,
 * and duplicates are collapsed server-side.
 *
 * De-duplication matters because a family that re-categorizes a global product
 * gets a family-scoped override row with the same name (see
 * `updateProductCategory`), so the same product would otherwise be listed
 * twice. The family row wins — it carries the family's own category — but the
 * group's highest usage_count is what ranks it, so an override with
 * usage_count = 0 doesn't sink a popular product.
 */
export function buildSuggestionQuery(
  userId: string,
  trimmed: string,
  limit: number,
) {
  const escaped = escapeLike(trimmed);
  const containsPattern = `%${escaped}%`;
  const prefixPattern = `${escaped}%`;

  return sql`
    WITH scoped AS (
      SELECT family_id FROM profiles WHERE id = ${userId}::uuid
    ),
    matched AS (
      SELECT
        p.id,
        p.name,
        p.category_id,
        p.family_id,
        p.usage_count
      FROM products p
      WHERE
        p.name ILIKE ${containsPattern} ESCAPE '\\'
        AND (
          p.family_id IS NULL
          OR p.family_id = (SELECT family_id FROM scoped)
        )
      ORDER BY p.usage_count DESC
      LIMIT ${SCAN_LIMIT}
    ),
    grouped AS (
      SELECT
        *,
        MAX(usage_count) OVER (PARTITION BY lower(name)) AS group_usage
      FROM matched
    ),
    deduped AS (
      SELECT DISTINCT ON (lower(name)) *
      FROM grouped
      ORDER BY lower(name), (family_id IS NOT NULL) DESC, usage_count DESC
    )
    SELECT
      d.id,
      d.name,
      d.category_id,
      c.name AS category_name,
      c.icon AS category_icon
    FROM deduped d
    LEFT JOIN categories c ON c.id = d.category_id
    ORDER BY
      (lower(d.name) = lower(${trimmed})) DESC,
      (lower(d.name) LIKE lower(${prefixPattern}) ESCAPE '\\') DESC,
      d.group_usage DESC,
      d.name ASC
    LIMIT ${limit}
  `;
}

export async function searchProductSuggestions(
  userId: string,
  query: string,
  limit: number = DEFAULT_SUGGESTION_LIMIT,
): Promise<ProductSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const result = await db.execute(buildSuggestionQuery(userId, trimmed, limit));
  return toSuggestions(result.rows);
}

/**
 * Embedding-backed suggestions, used to top up a thin keyword result set.
 *
 * This path calls the OpenAI embeddings API, so it costs hundreds of
 * milliseconds and must never block the keyword results — the client requests
 * it separately, after the fast results are already on screen.
 */
export async function searchProductSuggestionsSemantic(
  userId: string,
  query: string,
  excludeNames: string[] = [],
  limit: number = DEFAULT_SUGGESTION_LIMIT,
): Promise<ProductSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed || limit <= 0 || !isEmbeddingConfigured()) return [];

  const [profile] = (
    await db.execute(sql`
      SELECT family_id FROM profiles WHERE id = ${userId}::uuid LIMIT 1
    `)
  ).rows as { family_id: string | null }[];

  if (!profile?.family_id) return [];

  let similarIds: string[];
  try {
    const queryEmbedding = await generateEmbedding(trimmed);
    const similar = await findSimilarProducts(
      queryEmbedding,
      profile.family_id,
      { threshold: 0.7, limit: limit + excludeNames.length },
    );
    similarIds = similar.map((s) => s.id);
  } catch (err) {
    console.error('[searchProductSuggestions] Semantic search failed:', err);
    return [];
  }

  if (similarIds.length === 0) return [];

  const result = await db.execute(
    buildSemanticSuggestionQuery(
      similarIds,
      excludeNames.map((n) => n.trim().toLowerCase()),
      limit,
    ),
  );

  return toSuggestions(result.rows);
}

export function buildSemanticSuggestionQuery(
  similarIds: string[],
  excluded: string[],
  limit: number,
) {
  const idArray = sql`ARRAY[${sql.join(
    similarIds.map((id) => sql`${id}::uuid`),
    sql`, `,
  )}]`;

  return sql`
    WITH picked AS (
      SELECT DISTINCT ON (lower(p.name))
        p.id,
        p.name,
        p.category_id,
        p.family_id,
        p.usage_count
      FROM products p
      WHERE p.id = ANY(${idArray}::uuid[])
      ${
        excluded.length > 0
          ? sql`AND lower(p.name) NOT IN (${sql.join(
              excluded.map((n) => sql`${n}`),
              sql`, `,
            )})`
          : sql``
      }
      ORDER BY lower(p.name), (p.family_id IS NOT NULL) DESC, p.usage_count DESC
    )
    SELECT
      pk.id,
      pk.name,
      pk.category_id,
      c.name AS category_name,
      c.icon AS category_icon
    FROM picked pk
    LEFT JOIN categories c ON c.id = pk.category_id
    -- keep the embedding's relevance order, not the usage ranking
    ORDER BY array_position(${idArray}::uuid[], pk.id), pk.name ASC
    LIMIT ${limit}
  `;
}
