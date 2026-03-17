
-- Refund function for failed withdrawals
CREATE OR REPLACE FUNCTION public.refund_coins(
  _user_id uuid,
  _amount integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET coins = COALESCE(coins, 0) + _amount
  WHERE user_id = _user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;
