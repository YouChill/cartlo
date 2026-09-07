import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import {
  DEFAULT_SUGGESTION_LIMIT,
  searchProductSuggestions,
  searchProductSuggestionsSemantic,
  type ProductSuggestion,
} from '@/lib/shopping/product-search';

export const dynamic = 'force-dynamic';

/**
 * Autocomplete for the manual "add product" inputs.
 *
 * This is a route handler rather than a server action on purpose: server
 * actions are queued one at a time by the router and every response carries a
 * re-rendered RSC payload for the current page, which made per-keystroke
 * searches feel seconds slow. A plain GET is parallel, abortable and returns
 * nothing but the suggestions.
 *
 * `?semantic=1` runs the embeddings fallback instead of the keyword search;
 * the client asks for it separately so the OpenAI round trip never delays the
 * keyword results. `exclude` carries the names already on screen.
 */
export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ suggestions: [] }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const query = (params.get('q') ?? '').trim();
  if (!query) {
    return NextResponse.json({ suggestions: [] });
  }

  const parsedLimit = Number.parseInt(params.get('limit') ?? '', 10);
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 20)
      : DEFAULT_SUGGESTION_LIMIT;

  const semantic = params.get('semantic') === '1';

  let suggestions: ProductSuggestion[] = [];
  try {
    if (semantic) {
      const exclude = params
        .getAll('exclude')
        .flatMap((value) => value.split('\n'))
        .filter(Boolean);
      suggestions = await searchProductSuggestionsSemantic(
        userId,
        query,
        exclude,
        limit,
      );
    } else {
      suggestions = await searchProductSuggestions(userId, query, limit);
    }
  } catch (error) {
    console.error('[api/products/search] failed:', error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }

  return NextResponse.json(
    { suggestions },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
