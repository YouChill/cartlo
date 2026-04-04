import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { isEmbeddingConfigured, generateEmbedding, findSimilarProducts } from '@/lib/embeddings';

/**
 * GET /api/embeddings/test
 *
 * Diagnostics endpoint for verifying vector database and embedding setup.
 * Protected by AUTH_SECRET.
 *
 * Usage:
 *   curl https://your-app.vercel.app/api/embeddings/test \
 *     -H "Authorization: Bearer YOUR_AUTH_SECRET"
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.AUTH_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const report: Record<string, unknown> = {};

  // 1. Check OpenAI API key
  report.openai_key_configured = isEmbeddingConfigured();

  // 2. Check pgvector extension
  try {
    const extResult = await db.execute(
      sql`SELECT 1 FROM pg_extension WHERE extname = 'vector'`,
    );
    report.pgvector_installed = extResult.rows.length > 0;
  } catch (err) {
    report.pgvector_installed = false;
    report.pgvector_error = err instanceof Error ? err.message : String(err);
  }

  // 3. Check embedding column on products table
  try {
    await db.execute(sql`SELECT embedding FROM products LIMIT 0`);
    report.embedding_column_exists = true;
  } catch (err) {
    report.embedding_column_exists = false;
    report.embedding_column_error = err instanceof Error ? err.message : String(err);
  }

  // 4. Count products with and without embeddings
  try {
    const totalResult = await db.execute(
      sql`SELECT COUNT(*)::int AS total FROM products`,
    );
    const withEmbeddingResult = await db.execute(
      sql`SELECT COUNT(*)::int AS with_embedding FROM products WHERE embedding IS NOT NULL`,
    );
    report.products_total = totalResult.rows[0]?.total ?? 0;
    report.products_with_embedding = withEmbeddingResult.rows[0]?.with_embedding ?? 0;
  } catch (err) {
    report.products_count_error = err instanceof Error ? err.message : String(err);
  }

  // 5. Test live embedding generation + similarity search (only if everything looks good)
  if (report.openai_key_configured && report.pgvector_installed && report.embedding_column_exists) {
    try {
      const testEmbedding = await generateEmbedding('mleko');
      report.embedding_generation = 'ok';
      report.embedding_dimensions = testEmbedding.length;

      const similar = await findSimilarProducts(testEmbedding, null, {
        threshold: 0.5,
        limit: 3,
      });
      report.similarity_search = 'ok';
      report.similarity_test_results = similar.map((s) => ({
        name: s.name,
        similarity: s.similarity.toFixed(3),
      }));
    } catch (err) {
      report.live_test_error = err instanceof Error ? err.message : String(err);
    }
  }

  const allOk =
    report.openai_key_configured &&
    report.pgvector_installed &&
    report.embedding_column_exists;

  return NextResponse.json({ ok: allOk, ...report });
}
