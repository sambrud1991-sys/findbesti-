
-- Daily login rewards table
CREATE TABLE public.daily_login_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  login_date date NOT NULL DEFAULT CURRENT_DATE,
  streak integer NOT NULL DEFAULT 1,
  coins_earned integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, login_date)
);

ALTER TABLE public.daily_login_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own login rewards"
  ON public.daily_login_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RPC function to claim daily reward
CREATE OR REPLACE FUNCTION public.claim_daily_login_reward()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _today date := CURRENT_DATE;
  _yesterday date := CURRENT_DATE - 1;
  _last_streak integer;
  _new_streak integer;
  _coins integer;
  _already_claimed boolean;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM daily_login_rewards WHERE user_id = _user_id AND login_date = _today
  ) INTO _already_claimed;

  IF _already_claimed THEN
    SELECT streak, coins_earned INTO _new_streak, _coins
    FROM daily_login_rewards WHERE user_id = _user_id AND login_date = _today;
    RETURN jsonb_build_object('already_claimed', true, 'streak', _new_streak, 'coins', _coins);
  END IF;

  SELECT streak INTO _last_streak
  FROM daily_login_rewards WHERE user_id = _user_id AND login_date = _yesterday;

  IF _last_streak IS NOT NULL THEN
    _new_streak := LEAST(_last_streak + 1, 7);
  ELSE
    _new_streak := 1;
  END IF;

  _coins := 5 + (_new_streak - 1) * 5;

  INSERT INTO daily_login_rewards (user_id, login_date, streak, coins_earned)
  VALUES (_user_id, _today, _new_streak, _coins);

  UPDATE profiles SET coins = COALESCE(coins, 0) + _coins WHERE user_id = _user_id;

  RETURN jsonb_build_object('already_claimed', false, 'streak', _new_streak, 'coins', _coins);
END;
$$;
