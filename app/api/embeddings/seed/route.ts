import { NextRequest, NextResponse } from 'next/server';
import { seedMissingEmbeddings, isEmbeddingConfigured } from '@/lib/embeddings';

/**
 * POST /api/embeddings/seed
 *
 * Seeds embeddings for all products that don't have one yet.
 * Protected by a secret token to prevent unauthorized access.
 *
 * Usage:
 *   curl -X POST https://your-app.vercel.app/api/embeddings/seed \
 *     -H "Authorization: Bearer YOUR_AUTH_SECRET"
 */
export async function POST(request: NextRequest) {
  // Protect with AUTH_SECRET
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.AUTH_SECRET;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isEmbeddingConfigured()) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured' },
      { status: 500 },
    );
  }

  try {
    const result = await seedMissingEmbeddings();
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to seed embeddings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
