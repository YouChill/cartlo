-- =============================================================================
-- OPTIONAL cleanup: drop family-scoped product rows that merely shadow a
-- global product with the same name and the same category.
--
-- Both the autocomplete query and the settings product list now collapse these
-- pairs at read time, so nothing depends on this migration — it only shrinks
-- the table (fewer rows to scan, fewer embeddings to keep) and removes rows
-- that carry no information.
--
-- Rows that are real overrides (a family category different from the global
-- one) are kept untouched. Deleted rows donate their usage_count to the global
-- row they shadowed, so ranking does not regress.
--
-- Run deliberately; it deletes data. No table references products.id.
-- =============================================================================

BEGIN;

CREATE TEMP TABLE redundant_products ON COMMIT DROP AS
SELECT
  f.id AS duplicate_id,
  g.id AS global_id,
  f.usage_count AS duplicate_usage
FROM public.products f
JOIN public.products g
  ON g.family_id IS NULL
 AND lower(g.name) = lower(f.name)
WHERE f.family_id IS NOT NULL
  AND f.category_id IS NOT DISTINCT FROM g.category_id;

UPDATE public.products g
SET usage_count = g.usage_count + totals.extra
FROM (
  SELECT global_id, SUM(duplicate_usage)::int AS extra
  FROM redundant_products
  GROUP BY global_id
) AS totals
WHERE g.id = totals.global_id
  AND totals.extra > 0;

DELETE FROM public.products
WHERE id IN (SELECT duplicate_id FROM redundant_products);

COMMIT;
