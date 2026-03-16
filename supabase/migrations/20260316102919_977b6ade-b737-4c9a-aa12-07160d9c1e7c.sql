
-- Fix conversation UPDATE policy subquery bug
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;

CREATE POLICY "Users can update own conversations"
ON public.conversations
FOR UPDATE
TO public
USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
)
WITH CHECK (
  (auth.uid() = user1_id OR auth.uid() = user2_id)
  AND user1_id = (SELECT c.user1_id FROM public.conversations c WHERE c.id = conversations.id)
  AND user2_id = (SELECT c.user2_id FROM public.conversations c WHERE c.id = conversations.id)
);

-- Fix OTP codes policy: change from PERMISSIVE to RESTRICTIVE
DROP POLICY IF EXISTS "Deny all direct access to otp_codes" ON public.otp_codes;

CREATE POLICY "Deny all direct access to otp_codes"
ON public.otp_codes
AS RESTRICTIVE
FOR ALL
TO public
USING (false)
WITH CHECK (false);
