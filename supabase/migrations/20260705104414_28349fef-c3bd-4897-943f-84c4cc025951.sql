ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT;

-- Allow users to update these fields themselves (protect_profile_sensitive_fields trigger already whitelists non-listed fields)
