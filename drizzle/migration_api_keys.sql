-- =============================================================================
-- Migration: Add api_keys table (per-family keys for the agent REST API)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id        UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  agent_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name             TEXT NOT NULL DEFAULT 'Agent',
  key_hash         TEXT NOT NULL UNIQUE,
  key_prefix       TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at     TIMESTAMPTZ,
  revoked_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_family_id ON public.api_keys(family_id);
