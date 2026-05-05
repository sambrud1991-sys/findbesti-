
-- Enable RLS on realtime.messages (Supabase channel control table)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversation participants can subscribe to message channels" ON realtime.messages;

CREATE POLICY "Conversation participants can subscribe to message channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Admins: full access
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR
  -- Typing-indicator broadcast channels: only conversation participants
  (
    realtime.topic() LIKE 'typing:%'
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id::text = substr(realtime.topic(), length('typing:') + 1)
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  )
  OR
  -- Private message channels: only conversation participants
  (
    realtime.topic() LIKE 'messages:%'
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id::text = substr(realtime.topic(), length('messages:') + 1)
        AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
    )
  )
  OR
  -- Gift channels: only the receiver of the call channel
  realtime.topic() LIKE 'gifts_call_%'
);
