import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgeGateProps {
  onConfirm: () => void;
}

const AgeGate = ({ onConfirm }: AgeGateProps) => {
  const [agreed, setAgreed] = useState(false);
  const [denied, setDenied] = useState(false);

  const handleConfirm = () => {
    localStorage.setItem("findbesti_age_verified", "true");
    localStorage.setItem("findbesti_age_verified_at", new Date().toISOString());
    onConfirm();
  };

  const handleDeny = () => {
    setDenied(true);
  };

  if (denied) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-card rounded-3xl border border-border/50 p-6 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-destructive/15 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground mb-2">Access Restricted</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            FindBesti is an 18+ platform. You must be at least 18 years old to use this app. Please close the app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-card rounded-3xl border border-border/50 p-6 shadow-xl animate-slide-up">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Calendar className="w-8 h-8 text-primary-foreground" />
        </div>

        <h1 className="text-2xl font-extrabold text-foreground text-center mb-2">
          Age Verification
        </h1>
        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-5">
          FindBesti is intended for adults <span className="font-bold text-foreground">18 years and older</span>.
          By continuing you confirm your age and agree to our policies.
        </p>

        <div className="bg-muted/50 rounded-2xl p-4 mb-5 space-y-2 text-xs text-muted-foreground">
          <p>• Live video chat with real people</p>
          <p>• Community guidelines strictly enforced</p>
          <p>• Report & block available in every chat</p>
          <p>• Zero tolerance for nudity, harassment or illegal content</p>
        </div>

        <label className="flex items-start gap-2.5 mb-5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
          />
          <span className="text-xs text-foreground leading-relaxed">
            I confirm I am 18+ and I agree to the{" "}
            <Link to="/terms" target="_blank" className="text-primary font-bold underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy-policy" target="_blank" className="text-primary font-bold underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <div className="space-y-2">
          <Button
            onClick={handleConfirm}
            disabled={!agreed}
            className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-base shadow-lg hover:opacity-90 transition-all active:scale-[0.98]"
          >
            I am 18 or older — Continue
          </Button>
          <Button
            onClick={handleDeny}
            variant="ghost"
            className="w-full h-11 rounded-2xl font-semibold text-muted-foreground"
          >
            I am under 18
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgeGate;
