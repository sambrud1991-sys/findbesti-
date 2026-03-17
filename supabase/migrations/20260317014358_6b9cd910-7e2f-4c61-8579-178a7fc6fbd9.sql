
-- Fix 1: Messages UPDATE policy - prevent conversation_id injection
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages"
ON public.messages FOR UPDATE TO public
USING (auth.uid() = sender_id)
WITH CHECK (
  auth.uid() = sender_id
  AND conversation_id IS NOT DISTINCT FROM (
    SELECT m.conversation_id FROM public.messages m WHERE m.id = messages.id
  )
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (auth.uid() = c.user1_id OR auth.uid() = c.user2_id)
  )
);

-- Fix 2: Atomic withdrawal function to prevent race condition
CREATE OR REPLACE FUNCTION public.process_withdrawal_atomic(
  _user_id uuid,
  _amount integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET coins = coins - _amount
  WHERE user_id = _user_id AND COALESCE(coins, 0) >= _amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;
END;
$$;
