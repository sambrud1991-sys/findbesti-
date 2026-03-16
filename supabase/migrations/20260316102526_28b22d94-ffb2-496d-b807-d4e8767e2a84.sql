
-- Drop and recreate with stricter WITH CHECK
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
  AND user1_id = (SELECT c.user1_id FROM public.conversations c WHERE c.id = id)
  AND user2_id = (SELECT c.user2_id FROM public.conversations c WHERE c.id = id)
);
