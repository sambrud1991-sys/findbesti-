import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "rating_prompt_state_v1";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=app.lovable.80f205be8ffa4726a847d67024a67c51";
const DAYS_BEFORE_PROMPT = 3;
const REMIND_LATER_DAYS = 3;

type RatingState = {
  firstSeen: number; // timestamp
  rated?: boolean;
  dismissedForever?: boolean;
  remindAfter?: number; // timestamp
};

const RatingPrompt = () => {
  const [open, setOpen] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [selectedStars, setSelectedStars] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const now = Date.now();
      let state: RatingState;

      if (!raw) {
        state = { firstSeen: now };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return;
      }

      state = JSON.parse(raw);
      if (state.rated || state.dismissedForever) return;

      const daysSinceFirst = (now - state.firstSeen) / (1000 * 60 * 60 * 24);
      if (daysSinceFirst < DAYS_BEFORE_PROMPT) return;
      if (state.remindAfter && now < state.remindAfter) return;

      // Show after small delay
      const t = setTimeout(() => setOpen(true), 2500);
      return () => clearTimeout(t);
    } catch {
      // ignore
    }
  }, []);

  const updateState = (patch: Partial<RatingState>) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const state: RatingState = raw ? JSON.parse(raw) : { firstSeen: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, ...patch }));
    } catch {
      // ignore
    }
  };

  const handleStarClick = (stars: number) => {
    setSelectedStars(stars);
    setTimeout(() => {
      if (stars >= 4) {
        updateState({ rated: true });
        window.open(PLAY_STORE_URL, "_blank");
      } else {
        updateState({ dismissedForever: true });
      }
      setOpen(false);
    }, 400);
  };

  const handleRemindLater = () => {
    updateState({ remindAfter: Date.now() + REMIND_LATER_DAYS * 24 * 60 * 60 * 1000 });
    setOpen(false);
  };

  const handleNoThanks = () => {
    updateState({ dismissedForever: true });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleRemindLater()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Enjoying FIND BESTI? 💫</DialogTitle>
          <DialogDescription className="text-center">
            Aapka feedback humare liye bahut important hai. Kya aap humein rate karenge?
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => handleStarClick(s)}
              onMouseEnter={() => setHoverStar(s)}
              onMouseLeave={() => setHoverStar(0)}
              className="transition-transform hover:scale-125 active:scale-110"
              aria-label={`Rate ${s} stars`}
            >
              <Star
                size={36}
                className={
                  s <= (hoverStar || selectedStars)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }
              />
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="ghost" size="sm" onClick={handleRemindLater}>
            Baad mein yaad dilana
          </Button>
          <Button variant="ghost" size="sm" onClick={handleNoThanks} className="text-muted-foreground">
            Nahi, dhanyavaad
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingPrompt;
