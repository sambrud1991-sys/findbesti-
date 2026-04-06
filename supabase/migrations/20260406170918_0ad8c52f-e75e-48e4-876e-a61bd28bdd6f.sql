
-- Add is_verified to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Create profile verifications table
CREATE TABLE public.profile_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  selfie_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_verifications ENABLE ROW LEVEL SECURITY;

-- Users can submit verification requests
CREATE POLICY "Users can create own verification request"
ON public.profile_verifications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view own requests
CREATE POLICY "Users can view own verification requests"
ON public.profile_verifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all verification requests"
ON public.profile_verifications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update (approve/reject)
CREATE POLICY "Admins can update verification requests"
ON public.profile_verifications FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Timestamp trigger
CREATE TRIGGER update_profile_verifications_updated_at
BEFORE UPDATE ON public.profile_verifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for selfies
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-selfies', 'verification-selfies', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own verification selfie"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'verification-selfies' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public can view verification selfies"
ON storage.objects FOR SELECT
USING (bucket_id = 'verification-selfies');

CREATE POLICY "Admins can delete verification selfies"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'verification-selfies' AND public.has_role(auth.uid(), 'admin'::app_role));
