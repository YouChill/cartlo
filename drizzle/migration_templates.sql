-- =============================================================================
-- Migration: Add templates and template_items tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.template_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id  UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  category_id  UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_templates_family_id ON public.templates(family_id);
CREATE INDEX IF NOT EXISTS idx_template_items_template_id ON public.template_items(template_id);
