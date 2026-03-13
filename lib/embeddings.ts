import OpenAI from 'openai';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq, and, or, isNull, isNotNull, sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// OpenAI client (lazy singleton)
// ---------------------------------------------------------------------------

let openaiInstance: OpenAI | undefined;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is not set. Embedding-based classification will not work.',
      );
    }
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const DEFAULT_SIMILARITY_THRESHOLD = 0.8;

// ---------------------------------------------------------------------------
// Generate embedding for a text string
// ---------------------------------------------------------------------------

export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAI();

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.toLowerCase().trim(),
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0].embedding;
}

// ---------------------------------------------------------------------------
// Generate embeddings for multiple texts in a single API call (batch)
// ---------------------------------------------------------------------------

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const openai = getOpenAI();

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts.map((t) => t.toLowerCase().trim()),
    dimensions: EMBEDDING_DIMENSIONS,
  });

  // Sort by index to maintain order
  return response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

// ---------------------------------------------------------------------------
// Find similar products using pgvector cosine similarity
// ---------------------------------------------------------------------------

export type SimilarProduct = {
  id: string;
  name: string;
  categoryId: string | null;
  similarity: number;
};

export async function findSimilarProducts(
  embedding: number[],
  familyId: string | null,
  options?: {
    threshold?: number;
    limit?: number;
    requireCategory?: boolean;
  },
): Promise<SimilarProduct[]> {
  const {
    threshold = DEFAULT_SIMILARITY_THRESHOLD,
    limit = 5,
    requireCategory = false,
  } = options ?? {};

  const embeddingStr = `[${embedding.join(',')}]`;

  // cosine distance in pgvector: <=> operator
  // similarity = 1 - distance
  const results = await db.execute(sql`
    SELECT
      id,
      name,
      category_id,
      1 - (embedding <=> ${embeddingStr}::vector) AS similarity
    FROM products
    WHERE
      embedding IS NOT NULL
      AND (family_id IS NULL OR family_id = ${familyId})
      ${requireCategory ? sql`AND category_id IS NOT NULL` : sql``}
      AND 1 - (embedding <=> ${embeddingStr}::vector) >= ${threshold}
    ORDER BY embedding <=> ${embeddingStr}::vector ASC
    LIMIT ${limit}
  `);

  return results.rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: row.name as string,
    categoryId: (row.category_id as string) ?? null,
    similarity: parseFloat(row.similarity as string),
  }));
}

// ---------------------------------------------------------------------------
// Save embedding for a product
// ---------------------------------------------------------------------------

export async function saveProductEmbedding(
  productId: string,
  embedding: number[],
): Promise<void> {
  const embeddingStr = `[${embedding.join(',')}]`;

  await db.execute(sql`
    UPDATE products
    SET embedding = ${embeddingStr}::vector
    WHERE id = ${productId}
  `);
}

// ---------------------------------------------------------------------------
// Generate and save embedding for a product (convenience function)
// ---------------------------------------------------------------------------

export async function upsertProductEmbedding(
  productId: string,
  productName: string,
): Promise<number[]> {
  const embedding = await generateEmbedding(productName);
  await saveProductEmbedding(productId, embedding);
  return embedding;
}

// ---------------------------------------------------------------------------
// Check if OpenAI API is configured
// ---------------------------------------------------------------------------

export function isEmbeddingConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

// ---------------------------------------------------------------------------
// Seed embeddings for all products that don't have one yet
// ---------------------------------------------------------------------------

export async function seedMissingEmbeddings(): Promise<{
  processed: number;
  errors: number;
}> {
  const productsWithoutEmbedding = await db
    .select({ id: products.id, name: products.name })
    .from(products)
    .where(isNull(products.embedding));

  if (productsWithoutEmbedding.length === 0) {
    return { processed: 0, errors: 0 };
  }

  let processed = 0;
  let errors = 0;

  // Process in batches of 100 (OpenAI supports up to 2048 inputs per call)
  const BATCH_SIZE = 100;

  for (let i = 0; i < productsWithoutEmbedding.length; i += BATCH_SIZE) {
    const batch = productsWithoutEmbedding.slice(i, i + BATCH_SIZE);

    try {
      const embeddings = await generateEmbeddings(batch.map((p) => p.name));

      for (let j = 0; j < batch.length; j++) {
        try {
          await saveProductEmbedding(batch[j].id, embeddings[j]);
          processed++;
        } catch {
          errors++;
        }
      }
    } catch {
      errors += batch.length;
    }
  }

  return { processed, errors };
}
