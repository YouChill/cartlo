'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProductSuggestion } from '@/lib/shopping/product-search';

export type { ProductSuggestion };

/** Short enough to feel instant, long enough to skip most intermediate keys. */
const DEBOUNCE_MS = 140;
/** Delay before the (slow) embeddings top-up, measured from the fast result. */
const SEMANTIC_DELAY_MS = 250;
/** Only top up with semantic hits when the keyword search came back thin. */
const SEMANTIC_TRIGGER_COUNT = 3;
const MIN_SEMANTIC_LENGTH = 3;
const CACHE_LIMIT = 60;

type CacheEntry = {
  suggestions: ProductSuggestion[];
  /** Keyword results are complete for the query; semantic ones may extend it. */
  semanticDone: boolean;
};

function normalize(query: string): string {
  return query.trim().toLowerCase();
}

/**
 * Best-effort suggestions to paint while the request is still in flight:
 * whatever we already fetched for a prefix of the current query, narrowed to
 * the rows that still match. Wrong only by omission, and only until the
 * response lands — but it keeps the dropdown responsive on every keystroke.
 */
function localGuess(
  cache: Map<string, CacheEntry>,
  key: string,
): ProductSuggestion[] | null {
  for (let end = key.length - 1; end > 0; end--) {
    const entry = cache.get(key.slice(0, end));
    if (!entry) continue;
    return entry.suggestions.filter((s) => s.name.toLowerCase().includes(key));
  }
  return null;
}

function remember(
  cache: Map<string, CacheEntry>,
  key: string,
  entry: CacheEntry,
) {
  cache.delete(key);
  cache.set(key, entry);
  while (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

/**
 * Autocomplete state for the "add product" inputs.
 *
 * Keeps typing responsive by (a) hitting a plain GET route instead of a server
 * action, (b) aborting superseded requests so a slow early response can never
 * overwrite a newer one, (c) reusing cached results for prefixes of the
 * current query, and (d) fetching the embeddings-based suggestions in a second
 * request that only tops up an already-rendered list.
 */
export function useProductSuggestions() {
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const semanticRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  /** Query the UI is currently showing results for — guards late responses. */
  const activeQueryRef = useRef('');

  const cancelPending = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (semanticRef.current) {
      clearTimeout(semanticRef.current);
      semanticRef.current = null;
    }
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  useEffect(() => cancelPending, [cancelPending]);

  const fetchSuggestions = useCallback(
    async (
      key: string,
      options: { semantic?: boolean; exclude?: string[] } = {},
    ): Promise<ProductSuggestion[] | null> => {
      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;

      const params = new URLSearchParams({ q: key });
      if (options.semantic) params.set('semantic', '1');
      if (options.exclude?.length) {
        params.set('exclude', options.exclude.join('\n'));
      }

      try {
        const res = await fetch(`/api/products/search?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) return null;
        const data = (await res.json()) as {
          suggestions?: ProductSuggestion[];
        };
        return data.suggestions ?? [];
      } catch {
        // Aborted (superseded query) or offline — leave what's on screen.
        return null;
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [],
  );

  const scheduleSemantic = useCallback(
    (key: string, keywordResults: ProductSuggestion[]) => {
      if (semanticRef.current) clearTimeout(semanticRef.current);
      if (
        key.length < MIN_SEMANTIC_LENGTH ||
        keywordResults.length >= SEMANTIC_TRIGGER_COUNT
      ) {
        return;
      }

      semanticRef.current = setTimeout(async () => {
        semanticRef.current = null;
        if (activeQueryRef.current !== key) return;

        const extra = await fetchSuggestions(key, {
          semantic: true,
          exclude: keywordResults.map((s) => s.name),
        });
        if (!extra?.length || activeQueryRef.current !== key) return;

        const merged = [...keywordResults, ...extra];
        remember(cacheRef.current, key, {
          suggestions: merged,
          semanticDone: true,
        });
        setSuggestions(merged);
      }, SEMANTIC_DELAY_MS);
    },
    [fetchSuggestions],
  );

  const search = useCallback(
    (rawQuery: string) => {
      const key = normalize(rawQuery);
      activeQueryRef.current = key;
      cancelPending();

      if (!key) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      const cached = cacheRef.current.get(key);
      if (cached) {
        setSuggestions(cached.suggestions);
        setIsLoading(false);
        if (!cached.semanticDone) scheduleSemantic(key, cached.suggestions);
        return;
      }

      const guess = localGuess(cacheRef.current, key);
      if (guess) setSuggestions(guess);
      setIsLoading(true);

      debounceRef.current = setTimeout(async () => {
        debounceRef.current = null;
        const results = await fetchSuggestions(key);
        if (activeQueryRef.current !== key) return;

        if (results) {
          remember(cacheRef.current, key, {
            suggestions: results,
            semanticDone: false,
          });
          setSuggestions(results);
          scheduleSemantic(key, results);
        }
        setIsLoading(false);
      }, DEBOUNCE_MS);
    },
    [cancelPending, fetchSuggestions, scheduleSemantic],
  );

  /**
   * Clear suggestions after an item was added — the products table just
   * changed, so cached answers are stale.
   */
  const reset = useCallback(() => {
    activeQueryRef.current = '';
    cancelPending();
    cacheRef.current.clear();
    setSuggestions([]);
    setIsLoading(false);
  }, [cancelPending]);

  return { suggestions, isLoading, search, reset };
}
