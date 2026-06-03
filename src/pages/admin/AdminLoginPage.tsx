import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();

  // Auto-redirect once user is signed in and admin check resolves
  useEffect(() => {
    if (!user || adminLoading) return;
    if (isAdmin) {
      navigate("/control-room", { replace: true });
    } else {
      toast.error("This account doesn't have admin access");
    }
  }, [user, isAdmin, adminLoading, navigate]);

  const handleAuth = async () => {
    if (!email) {
      toast.error("Please enter email");
      return;
    }
    if (!isForgot && !password) {
      toast.error("Please enter password");
      return;
    }
    setLoading(true);
    try {
      if (isForgot) {
        // Client-side rate limit: 60s cooldown, max 3/hour
        const RL_KEY = "admin_forgot_pw_rl";
        const now = Date.now();
        const stored = JSON.parse(localStorage.getItem(RL_KEY) || "[]") as number[];
        const recent = stored.filter((t) => now - t < 60 * 60 * 1000);
        const last = recent[recent.length - 1];
        if (last && now - last < 60 * 1000) {
          const wait = Math.ceil((60 * 1000 - (now - last)) / 1000);
          toast.error(`Please wait ${wait}s before requesting again`);
          setLoading(false);
          return;
        }
        if (recent.length >= 3) {
          toast.error("Too many requests. Try again later.");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/control-room/reset-password`,
        });
        if (error) throw error;
        localStorage.setItem(RL_KEY, JSON.stringify([...recent, now]));
        toast.success("Password reset link sent! Check your email.");
        setIsForgot(false);
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/control-room/login` },
        });
        if (error) throw error;
        toast.success("Check your email to confirm signup!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login successful!");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isForgot ? "Reset your password" : isSignUp ? "Create admin account" : "Sign in to continue"}
          </p>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 rounded-xl"
            />
          </div>
          {!isForgot && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12 rounded-xl"
              />
            </div>
          )}
          <Button
            onClick={handleAuth}
            disabled={loading}
            className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-bold"
          >
            {loading ? "Please wait..." : isForgot ? "Send Reset Link" : isSignUp ? "Sign Up" : "Sign In"}
          </Button>
          {!isForgot && !isSignUp && (
            <button
              onClick={() => setIsForgot(true)}
              className="w-full text-center text-sm text-primary font-semibold"
            >
              Forgot password?
            </button>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {isForgot ? (
            <button onClick={() => setIsForgot(false)} className="font-bold text-primary">
              Back to Sign In
            </button>
          ) : (
            <>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button onClick={() => setIsSignUp(!isSignUp)} className="font-bold text-primary">
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
