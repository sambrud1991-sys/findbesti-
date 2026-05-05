
-- 1. Make verification-selfies bucket PRIVATE
UPDATE storage.buckets SET public = false WHERE id = 'verification-selfies';

-- Drop overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view verification selfies" ON storage.objects;

-- Owners can read their own selfies
CREATE POLICY "Users can view own verification selfie"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'verification-selfies'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can read all verification selfies
CREATE POLICY "Admins can view all verification selfies"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'verification-selfies'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 2. Harden send_gift with server-side gift catalogue
CREATE OR REPLACE FUNCTION public.send_gift(
  _receiver_id uuid,
  _gift_id text,
  _gift_name text DEFAULT NULL,
  _gift_emoji text DEFAULT NULL,
  _coins_spent integer DEFAULT NULL,
  _channel_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _sender_id uuid := auth.uid();
  _current_coins integer;
  _canonical_name text;
  _canonical_emoji text;
  _canonical_price integer;
BEGIN
  IF _sender_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _sender_id = _receiver_id THEN
    RAISE EXCEPTION 'Cannot gift yourself';
  END IF;

  -- Server-side gift catalogue (must match client GIFTS list)
  CASE _gift_id
    WHEN 'rose'    THEN _canonical_name := 'Rose';    _canonical_emoji := '🌹'; _canonical_price := 10;
    WHEN 'heart'   THEN _canonical_name := 'Heart';   _canonical_emoji := '❤️'; _canonical_price := 20;
    WHEN 'star'    THEN _canonical_name := 'Star';    _canonical_emoji := '⭐'; _canonical_price := 50;
    WHEN 'fire'    THEN _canonical_name := 'Fire';    _canonical_emoji := '🔥'; _canonical_price := 80;
    WHEN 'diamond' THEN _canonical_name := 'Diamond'; _canonical_emoji := '💎'; _canonical_price := 100;
    WHEN 'crown'   THEN _canonical_name := 'Crown';   _canonical_emoji := '👑'; _canonical_price := 200;
    WHEN 'rocket'  THEN _canonical_name := 'Rocket';  _canonical_emoji := '🚀'; _canonical_price := 300;
    WHEN 'trophy'  THEN _canonical_name := 'Trophy';  _canonical_emoji := '🏆'; _canonical_price := 500;
    ELSE
      RAISE EXCEPTION 'Unknown gift id: %', _gift_id;
  END CASE;

  -- Get and lock sender's balance
  SELECT coins INTO _current_coins
  FROM public.profiles
  WHERE user_id = _sender_id
  FOR UPDATE;

  IF _current_coins IS NULL OR _current_coins < _canonical_price THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;

  UPDATE public.profiles
  SET coins = coins - _canonical_price
  WHERE user_id = _sender_id;

  INSERT INTO public.gift_transactions (sender_id, receiver_id, gift_id, gift_name, gift_emoji, coins_spent, channel_name)
  VALUES (_sender_id, _receiver_id, _gift_id, _canonical_name, _canonical_emoji, _canonical_price, _channel_name);
END;
$function$;
