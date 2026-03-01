-- =============================================================================
-- Cartlo — Row Level Security Policies
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- Helper: get current user's family_id
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_my_family_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = ''
AS $$
  SELECT family_id FROM public.profiles WHERE id = auth.uid();
$$;

-- =============================================================================
-- FAMILIES
-- =============================================================================

-- Users can read their own family
CREATE POLICY "families: users can read own family"
  ON public.families FOR SELECT
  USING (id = public.get_my_family_id());

-- Users can update their own family (e.g., regenerate invite code)
CREATE POLICY "families: users can update own family"
  ON public.families FOR UPDATE
  USING (id = public.get_my_family_id());

-- Any authenticated user can create a family
CREATE POLICY "families: authenticated users can create"
  ON public.families FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Anyone can read a family by invite_code (for join flow)
CREATE POLICY "families: anyone can read by invite_code"
  ON public.families FOR SELECT
  USING (true);

-- =============================================================================
-- PROFILES
-- =============================================================================

-- Users can read profiles of their family members
CREATE POLICY "profiles: read family members"
  ON public.profiles FOR SELECT
  USING (
    family_id = public.get_my_family_id()
    OR id = auth.uid()
  );

-- Users can update their own profile
CREATE POLICY "profiles: update own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Service role inserts profiles via trigger, but user may also need to
-- update family_id when joining a family
CREATE POLICY "profiles: insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- =============================================================================
-- CATEGORIES
-- =============================================================================

-- Read: global categories (family_id IS NULL) OR own family categories
CREATE POLICY "categories: read global or own family"
  ON public.categories FOR SELECT
  USING (
    family_id IS NULL
    OR family_id = public.get_my_family_id()
  );

-- Insert: only own family categories
CREATE POLICY "categories: insert for own family"
  ON public.categories FOR INSERT
  WITH CHECK (family_id = public.get_my_family_id());

-- Update: only own family categories
CREATE POLICY "categories: update own family"
  ON public.categories FOR UPDATE
  USING (family_id = public.get_my_family_id());

-- Delete: only own family categories
CREATE POLICY "categories: delete own family"
  ON public.categories FOR DELETE
  USING (family_id = public.get_my_family_id());

-- =============================================================================
-- PRODUCTS
-- =============================================================================

-- Read: global products (family_id IS NULL) OR own family products
CREATE POLICY "products: read global or own family"
  ON public.products FOR SELECT
  USING (
    family_id IS NULL
    OR family_id = public.get_my_family_id()
  );

-- Insert: global (null) or own family
CREATE POLICY "products: insert for own family"
  ON public.products FOR INSERT
  WITH CHECK (
    family_id IS NULL
    OR family_id = public.get_my_family_id()
  );

-- Update: global or own family (for usage_count increment)
CREATE POLICY "products: update global or own family"
  ON public.products FOR UPDATE
  USING (
    family_id IS NULL
    OR family_id = public.get_my_family_id()
  );

-- =============================================================================
-- SHOPPING_ITEMS
-- =============================================================================

-- Full CRUD only for own family

CREATE POLICY "shopping_items: read own family"
  ON public.shopping_items FOR SELECT
  USING (family_id = public.get_my_family_id());

CREATE POLICY "shopping_items: insert own family"
  ON public.shopping_items FOR INSERT
  WITH CHECK (family_id = public.get_my_family_id());

CREATE POLICY "shopping_items: update own family"
  ON public.shopping_items FOR UPDATE
  USING (family_id = public.get_my_family_id());

CREATE POLICY "shopping_items: delete own family"
  ON public.shopping_items FOR DELETE
  USING (family_id = public.get_my_family_id());
