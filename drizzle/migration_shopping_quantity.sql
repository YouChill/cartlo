-- Add quantity and unit fields to shopping_items table
ALTER TABLE shopping_items
  ADD COLUMN IF NOT EXISTS quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'szt';
