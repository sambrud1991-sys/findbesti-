DROP POLICY IF EXISTS "Conversation participants can subscribe to message channels" ON realtime.messages;

CREATE POLICY "Conversation participants can subscribe to message channels"
ON realtime.messages
FOR SELECT
TO authenticated
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
);

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.is_blocked IS DISTINCT FROM OLD.is_blocked
     OR NEW.referred_by IS DISTINCT FROM OLD.referred_by
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.followers IS DISTINCT FROM OLD.followers
     OR NEW.following IS DISTINCT FROM OLD.following
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.id IS DISTINCT FROM OLD.id
     OR NEW.is_verified IS DISTINCT FROM OLD.is_verified THEN
    RAISE EXCEPTION 'Updating restricted profile fields is not allowed';
  END IF;

  IF NEW.coins IS DISTINCT FROM OLD.coins THEN
    IF NEW.coins IS NULL OR NEW.coins < 0 OR NEW.coins > COALESCE(OLD.coins, 0) THEN
      RAISE EXCEPTION 'Invalid coin balance update';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;