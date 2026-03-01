-- =============================================================================
-- Cartlo — Database Schema
-- Migration: Create tables, indexes, trigger
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tables
-- -----------------------------------------------------------------------------

-- Families
CREATE TABLE public.families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Profiles (1:1 with auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id uuid REFERENCES public.families(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Categories (global or per-family)
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL,
  sort_order int NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  family_id uuid REFERENCES public.families(id) ON DELETE CASCADE
);

-- Products (global or per-family)
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  family_id uuid REFERENCES public.families(id) ON DELETE CASCADE,
  usage_count int NOT NULL DEFAULT 0,
  UNIQUE(name, family_id)
);

-- Shopping Items
CREATE TABLE public.shopping_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  is_checked boolean NOT NULL DEFAULT false,
  added_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  checked_at timestamptz
);

-- -----------------------------------------------------------------------------
-- 2. Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX idx_shopping_items_family_id
  ON public.shopping_items(family_id);

CREATE INDEX idx_shopping_items_family_checked
  ON public.shopping_items(family_id, is_checked);

CREATE INDEX idx_products_name_family
  ON public.products(name, family_id);

CREATE INDEX idx_families_invite_code
  ON public.families(invite_code);

-- -----------------------------------------------------------------------------
-- 3. Trigger: auto-create profile on new auth.users
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 4. Enable Realtime for shopping_items
-- -----------------------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_items;
