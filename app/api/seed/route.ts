import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { seedMissingEmbeddings, isEmbeddingConfigured } from '@/lib/embeddings';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.AUTH_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: {
    sql: { success: boolean; error?: string };
    embeddings: { success: boolean; processed?: number; errors?: number; error?: string };
  } = {
    sql: { success: false },
    embeddings: { success: false },
  };

  // Step 1: Run seed.sql
  try {
    const seedPath = join(process.cwd(), 'drizzle', 'seed.sql');
    const seedSql = await readFile(seedPath, 'utf-8');
    await db.execute(sql.raw(seedSql));
    results.sql = { success: true };
  } catch (error) {
    results.sql = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run seed.sql',
    };
    return NextResponse.json(results, { status: 500 });
  }

  // Step 2: Seed embeddings
  if (isEmbeddingConfigured()) {
    try {
      const embeddingResult = await seedMissingEmbeddings();
      results.embeddings = { success: true, ...embeddingResult };
    } catch (error) {
      results.embeddings = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to seed embeddings',
      };
    }
  } else {
    results.embeddings = {
      success: false,
      error: 'OPENAI_API_KEY not configured — skipped embeddings',
    };
  }

  const status = results.sql.success ? 200 : 500;
  return NextResponse.json(results, { status });
}
