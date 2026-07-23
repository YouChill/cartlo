-- =============================================================================
-- Make global products (family_id IS NULL) truly unique by case-insensitive
-- name, so the seed is idempotent and autocomplete has no duplicates.
--
-- The existing unique index products_name_family_idx (name, family_id) does not
-- dedupe globals because Postgres treats NULL family_id values as distinct.
-- Deduplicate first (no table FK-references products.id), then add a partial
-- unique index used as the seed's ON CONFLICT arbiter.
-- =============================================================================

WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY lower(name)
           ORDER BY usage_count DESC, id ASC
         ) AS rn
  FROM public.products
  WHERE family_id IS NULL
)
DELETE FROM public.products p
USING ranked r
WHERE p.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS products_global_name_uq
  ON public.products (lower(name))
  WHERE family_id IS NULL;
