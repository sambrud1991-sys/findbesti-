
import { useState, useEffect } from "react";
import { Gift, Flame, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const STREAK_REWARDS = [5, 10, 15, 20, 25, 30, 40];

const DailyRewardPopup = () => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [streak, setStreak] = useState(1);
  const [coins, setCoins] = useState(5);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!user) return;
    const claimed = sessionStorage.getItem(`daily_reward_checked_${user.id}`);
    if (claimed) return;

    const claimReward = async () => {
      try {
        const { data, error } = await supabase.rpc("claim_daily_login_reward" as any);
        if (error) throw error;
        const result = data as any;
        setStreak(result.streak);
        setCoins(result.coins);
        setAlreadyClaimed(result.already_claimed);
        if (!result.already_claimed) {
          setShow(true);
        }
        sessionStorage.setItem(`daily_reward_checked_${user.id}`, "true");
      } catch (err) {
        console.error("Daily reward error:", err);
      }
    };
    claimReward();
  }, [user]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 animate-in fade-in duration-300">
      <div className="bg-card rounded-3xl p-6 mx-4 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 relative">
        <button onClick={() => setShow(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X size={20} />
        </button>

        <div className="text-center mb-4">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3" style={{ animation: "float 3s ease-in-out infinite" }}>
            <Gift size={32} className="text-accent" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground">Daily Reward! 🎉</h2>
          <p className="text-muted-foreground text-sm mt-1">
            You earned <span className="font-bold text-accent">{coins} coins</span> today!
          </p>
        </div>

        {/* Streak Display */}
        <div className="mb-4">
          <div className="flex items-center justify-center gap-1 mb-2">
            <Flame size={16} className="text-primary" />
            <span className="text-sm font-bold text-foreground">Day {streak} Streak</span>
          </div>
          <div className="flex justify-between gap-1">
            {STREAK_REWARDS.map((reward, i) => {
              const day = i + 1;
              const isActive = day <= streak;
              const isCurrent = day === streak;
              return (
                <div key={day} className="flex-1 text-center">
                  <div className={`rounded-xl py-2 px-1 text-xs font-bold transition-all ${
                    isCurrent ? "gradient-primary text-primary-foreground scale-110 shadow-md" :
                    isActive ? "bg-primary/20 text-primary" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    <div className="text-[10px]">D{day}</div>
                    <div>🪙{reward}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mb-4">
          Login daily to increase your streak & earn more coins!
        </p>

        <button
          onClick={() => setShow(false)}
          className="w-full gradient-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-all active:scale-95"
        >
          Collect 🪙 {coins}
        </button>
      </div>
    </div>
  );
};

export default DailyRewardPopup;
