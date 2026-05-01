import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Gift, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const PENDING_REFERRAL_KEY = "pending_referral_code";

const InvitePage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (code) {
      localStorage.setItem(PENDING_REFERRAL_KEY, code.toUpperCase());
    }
  }, [code]);

  const handleContinue = () => {
    if (user) navigate("/referral");
    else navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="gradient-primary rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary-foreground/20 flex items-center justify-center mb-4" style={{ animation: "float 3s ease-in-out infinite" }}>
            <Gift size={40} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-extrabold text-primary-foreground mb-2">
            You're Invited! 🎉
          </h1>
          <p className="text-primary-foreground/80 text-sm mb-6">
            Aapke dost ne aapko <span className="font-bold">FIND BESTI</span> par invite kiya hai. Join karo aur exciting rewards paao!
          </p>

          <div className="bg-primary-foreground/15 rounded-2xl p-4 mb-6">
            <p className="text-primary-foreground/70 text-xs font-bold uppercase tracking-wider mb-1">Referral Code</p>
            <p className="text-3xl font-black text-primary-foreground tracking-[0.3em]">
              {code?.toUpperCase() || "—"}
            </p>
          </div>

          <Button
            onClick={handleContinue}
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-primary-foreground text-primary font-extrabold text-base shadow-lg hover:bg-primary-foreground/90"
          >
            <Sparkles size={18} /> {user ? "Apply Code" : "Join Now"}
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {[
            { icon: Users, text: "Real logon se baat karo, video chat enjoy karo" },
            { icon: Gift, text: "Sign up karo aur referral bonus paao" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                <item.icon size={16} className="text-primary-foreground" />
              </div>
              <p className="text-sm text-foreground font-medium">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InvitePage;
