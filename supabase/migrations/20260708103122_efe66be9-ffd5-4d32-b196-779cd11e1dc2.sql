
CREATE TYPE public.call_type_enum AS ENUM ('audio', 'video');
CREATE TYPE public.call_status_enum AS ENUM ('accepted', 'rejected', 'missed', 'cancelled', 'completed');

CREATE TABLE public.call_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  call_type public.call_type_enum NOT NULL,
  status public.call_status_enum NOT NULL DEFAULT 'missed',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  channel_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX call_history_caller_idx   ON public.call_history (caller_id, started_at DESC);
CREATE INDEX call_history_receiver_idx ON public.call_history (receiver_id, started_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.call_history TO authenticated;
GRANT ALL ON public.call_history TO service_role;

ALTER TABLE public.call_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their calls"
  ON public.call_history FOR SELECT
  TO authenticated
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Participants can insert their calls"
  ON public.call_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Participants can update their calls"
  ON public.call_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Admins can delete calls"
  ON public.call_history FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_call_history_updated_at
  BEFORE UPDATE ON public.call_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
