-- =============================================================================
-- Speed up autocomplete: trigram index for the substring match behind
-- GET /api/products/search.
--
-- The suggestion query filters with `name ILIKE '%…%'`, which no B-tree index
-- can serve — every keystroke meant a sequential scan of products. A GIN
-- trigram index on the column supports both LIKE and ILIKE patterns.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS products_name_trgm_idx
  ON public.products USING gin (name gin_trgm_ops);
