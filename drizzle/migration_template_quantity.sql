-- =============================================================================
-- Migration: Add quantity and unit columns to template_items
-- =============================================================================

ALTER TABLE public.template_items
  ADD COLUMN IF NOT EXISTS quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'szt';
