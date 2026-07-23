-- =============================================================================
-- Add users.login_disabled and lock down synthetic "Agent" accounts
-- =============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS login_disabled boolean NOT NULL DEFAULT false;

-- Any pre-existing synthetic per-family agent account must never be loginable.
UPDATE public.users
SET login_disabled = true
WHERE email LIKE 'agent+%@agent.cartlo.internal';
