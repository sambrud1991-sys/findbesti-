
-- 1) Create user_phones table
CREATE TABLE IF NOT EXISTS public.user_phones (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_phones TO authenticated;
GRANT ALL ON public.user_phones TO service_role;

ALTER TABLE public.user_phones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own phone"
  ON public.user_phones FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all phones"
  ON public.user_phones FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can insert own phone"
  ON public.user_phones FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phone"
  ON public.user_phones FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_phones_updated_at
  BEFORE UPDATE ON public.user_phones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Migrate existing phone data
INSERT INTO public.user_phones (user_id, phone)
SELECT user_id, phone FROM public.profiles
WHERE phone IS NOT NULL AND phone <> ''
ON CONFLICT (user_id) DO NOTHING;

-- 3) Drop phone column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;

-- 4) Replace realtime.messages policy to also cover per-user gift transaction topics
DROP POLICY IF EXISTS "Conversation participants can subscribe to message channels" ON realtime.messages;

CREATE POLICY "Conversation participants can subscribe to message channels"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (
      realtime.topic() LIKE 'typing:%'
      AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id::text = substr(realtime.topic(), length('typing:') + 1)
          AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
      )
    )
    OR (
      realtime.topic() LIKE 'messages:%'
      AND EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id::text = substr(realtime.topic(), length('messages:') + 1)
          AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
      )
    )
    OR (
      realtime.topic() ~ '^gifts_call_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND (
        auth.uid()::text = split_part(substr(realtime.topic(), length('gifts_call_') + 1), '_', 1)
        OR auth.uid()::text = split_part(substr(realtime.topic(), length('gifts_call_') + 1), '_', 2)
      )
    )
    OR (
      -- Per-user gift transaction subscription topic: gifts_user_<uuid>
      realtime.topic() ~ '^gifts_user_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND auth.uid()::text = substr(realtime.topic(), length('gifts_user_') + 1)
    )
  );
