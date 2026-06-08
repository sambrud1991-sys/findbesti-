import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Lock, ArrowLeft, Shield, Sparkles, Heart, ChevronDown, Search, X } from "lucide-react";
import { toast } from "sonner";
import { initFirebase, setupRecaptcha, sendFirebaseOtp, type ConfirmationResult, type Auth } from "@/lib/firebase";
import { countryCodes, type CountryCode } from "@/data/countryCodes";

const AuthPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(countryCodes[0]); // India default
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<any>(null);
  const firebaseAuthRef = useRef<Auth | null>(null);
  const recaptchaContainerIdRef = useRef(0);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initFirebase().then((auth) => {
      firebaseAuthRef.current = auth;
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowCountryPicker(false);
      }
    };
    if (showCountryPicker) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCountryPicker]);

  const filteredCountries = countrySearch
    ? countryCodes.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.includes(countrySearch)
      )
    : countryCodes;

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Google Sign In failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const fullPhone = selectedCountry.code + phone;
    setLoading(true);
    try {
      const auth = firebaseAuthRef.current || await initFirebase();

      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch (_) {}
        recaptchaVerifierRef.current = null;
      }

      const oldContainer = document.getElementById("recaptcha-container");
      if (oldContainer) oldContainer.remove();

      recaptchaContainerIdRef.current += 1;
      const newContainer = document.createElement("div");
      newContainer.id = "recaptcha-container";
      newContainer.setAttribute("data-key", String(recaptchaContainerIdRef.current));
      document.body.appendChild(newContainer);

      recaptchaVerifierRef.current = setupRecaptcha(auth, "recaptcha-container");

      const confirmationResult = await sendFirebaseOtp(fullPhone, recaptchaVerifierRef.current);
      confirmationResultRef.current = confirmationResult;
      setOtpSent(true);
      toast.success(t("toast.otpSent"));
    } catch (error: any) {
      console.error("Send OTP error:", error);
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch (_) {}
      }
      recaptchaVerifierRef.current = null;
      const container = document.getElementById("recaptcha-container");
      if (container) container.remove();
      toast.error(error.message || t("toast.otpFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error(t("toast.enterOtp"));
      return;
    }
    setLoading(true);
    try {
      if (!confirmationResultRef.current) {
        throw new Error("Please request OTP first");
      }

      const result = await confirmationResultRef.current.confirm(otp);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      const res = await supabase.functions.invoke("verify-otp", {
        body: { firebase_id_token: idToken },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      if (res.data?.session) {
        await supabase.auth.setSession({
          access_token: res.data.session.access_token,
          refresh_token: res.data.session.refresh_token,
        });
        toast.success(t("toast.loginSuccess"));
      } else {
        throw new Error("Session not received");
      }
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      toast.error(error.message || t("toast.otpVerifyFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">

      {/* Hero Section */}
      <div className="gradient-primary relative flex-1 flex flex-col px-6 pt-10 pb-8 overflow-hidden">
        {/* Soft ambient highlights (no blur — keeps mobile GPU happy) */}
        <div className="absolute -top-20 -left-16 w-72 h-72 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute top-40 -right-20 w-80 h-80 rounded-full bg-fuchsia-300/15 pointer-events-none" />
        <div className="absolute bottom-10 left-1/3 w-56 h-56 rounded-full bg-purple-400/10 pointer-events-none" />

        {/* Floating sparkle dots */}
        <div className="absolute top-24 left-8 w-2 h-2 rounded-full bg-white/60 animate-float" />
        <div className="absolute top-44 right-10 w-1.5 h-1.5 rounded-full bg-white/50 animate-float" style={{ animationDelay: "0.6s" }} />
        <div className="absolute bottom-32 left-10 w-2.5 h-2.5 rounded-full bg-white/40 animate-float" style={{ animationDelay: "1.2s" }} />
        <div className="absolute bottom-48 right-20 w-1.5 h-1.5 rounded-full bg-white/60 animate-float" style={{ animationDelay: "0.9s" }} />

        {/* Heart badge top right */}
        <div className="absolute top-8 right-6 animate-bounce-in z-10" style={{ animationDelay: "0.3s" }}>
          <div className="w-14 h-14 rounded-2xl bg-white/25 flex items-center justify-center rotate-12 shadow-xl border border-white/30">
            <Heart className="w-7 h-7 text-white fill-white/60" />
          </div>
        </div>
        <div className="absolute top-32 right-14 animate-bounce-in z-10" style={{ animationDelay: "0.5s" }}>
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center -rotate-12 border border-white/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Brand */}
        <div className="animate-slide-up relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/25 border border-white/25 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-[11px] font-bold text-white tracking-wider uppercase">12,438 online now</span>
          </div>
          <h1 className="text-[3.5rem] font-black text-white italic tracking-tight leading-[0.95] drop-shadow-lg">FIND</h1>
          <h1 className="text-[3.5rem] font-black text-white italic tracking-tight leading-[0.95] mt-1 drop-shadow-lg">
            BESTI<span className="text-yellow-300">.</span>
          </h1>
          <p className="mt-3 text-white/85 text-base font-semibold max-w-[18rem] leading-snug">
            Real people. Real chats. <br />Find your vibe in seconds ✨
          </p>
        </div>

        {/* Live avatars row */}
        <div className="mt-6 flex items-center gap-3 animate-slide-up relative z-10" style={{ animationDelay: "0.1s" }}>
          <div className="flex -space-x-3">
            {[
              "https://i.pravatar.cc/80?img=47",
              "https://i.pravatar.cc/80?img=32",
              "https://i.pravatar.cc/80?img=68",
              "https://i.pravatar.cc/80?img=25",
            ].map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-md"
              />
            ))}
            <div className="w-10 h-10 rounded-full border-2 border-white bg-white/35 flex items-center justify-center text-[10px] font-black text-white">
              +5K
            </div>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white text-sm font-extrabold">Join the besti club</span>
            <span className="text-white/75 text-[11px] font-semibold">⭐ 4.8 · trusted by 1M+</span>
          </div>
        </div>

        {/* Feature pills */}
        <div className="mt-5 flex flex-wrap gap-2 animate-slide-up relative z-10" style={{ animationDelay: "0.18s" }}>
          <div className="flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-full bg-white/25 border border-white/25">
            <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-extrabold text-white">{t("auth.safe")}</span>
          </div>
          <div className="flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-full bg-white/25 border border-white/25">
            <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-extrabold text-white">{t("auth.noFake")}</span>
          </div>
          <div className="flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-full bg-white/25 border border-white/25">
            <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="text-xs font-extrabold text-white">Free to join</span>
          </div>
        </div>

        <div className="flex-1" />
      </div>

      {/* Bottom Auth Card */}
      <div className="bg-card rounded-t-[2rem] -mt-24 relative z-10 px-5 pt-6 pb-5 shadow-[0_-12px_40px_rgba(0,0,0,0.15)] animate-slide-up" style={{ animationDelay: "0.25s" }}>
        {!otpSent ? (
          <div className="space-y-3.5">
            <div className="relative pt-1">
              <span className="absolute left-6 -top-1 px-1.5 bg-card text-xs font-semibold text-foreground z-10">
                Phone number
              </span>
            <div className="flex items-center gap-0 h-14 rounded-full bg-card border-2 border-foreground overflow-visible relative focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/50 focus-within:shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition-all duration-200">
              {/* Country Code Picker Button */}
              <div className="relative" ref={pickerRef}>
                <button
                  type="button"
                  onClick={() => { setShowCountryPicker(!showCountryPicker); setCountrySearch(""); }}
                  className="flex items-center gap-1 pl-3 pr-1.5 h-14 hover:bg-muted/60 transition-colors rounded-l-2xl"
                >
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span className="text-sm font-bold text-foreground">{selectedCountry.code}</span>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>

                {/* Country Dropdown */}
                {showCountryPicker && (
                  <div className="absolute left-0 bottom-[calc(100%+4px)] w-72 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-up">
                    <div className="p-3 border-b border-border">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search country or code..."
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className="w-full bg-muted rounded-xl pl-9 pr-8 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        {countrySearch && (
                          <button onClick={() => setCountrySearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                            <X size={14} className="text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredCountries.map((country) => (
                        <button
                          key={country.name + country.code}
                          onClick={() => {
                            setSelectedCountry(country);
                            setShowCountryPicker(false);
                            setCountrySearch("");
                            setPhone("");
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                            selectedCountry.code === country.code && selectedCountry.name === country.name
                              ? "bg-primary/10 text-primary font-bold"
                              : "text-foreground"
                          }`}
                        >
                          <span className="text-lg">{country.flag}</span>
                          <span className="flex-1 text-left">{country.name}</span>
                          <span className="text-muted-foreground font-mono text-xs">{country.code}</span>
                          {selectedCountry.code === country.code && selectedCountry.name === country.name && (
                            <span className="text-primary">✓</span>
                          )}
                        </button>
                      ))}
                      {filteredCountries.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-4">No country found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Input
                type="tel"
                placeholder="Enter your number"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, selectedCountry.maxDigits);
                  setPhone(val);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (phone.length >= 7) handleSendOtp();
                    else toast.error(t("toast.invalidMobile"));
                  }
                }}
                className="border-0 bg-transparent h-full text-base font-semibold focus-visible:ring-0 shadow-none pl-2"
              />
            </div>
            </div>
            <Button
              onClick={() => {
                if (phone.length >= 7) {
                  handleSendOtp();
                } else {
                  toast.error(t("toast.invalidMobile"));
                }
              }}
              disabled={loading || phone.length < 7}
              className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-base shadow-lg hover:opacity-90 transition-all active:scale-[0.98]"
            >
              {loading ? t("auth.sending") : t("auth.getOtp")}
            </Button>
          </div>
        ) : (
          <div className="space-y-3.5">
            <button
              onClick={() => { setOtpSent(false); setOtp(""); confirmationResultRef.current = null; }}
              className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground mb-1 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {t("auth.changeNumber")}
            </button>
            <p className="text-sm text-muted-foreground text-center">
              {t("auth.otpSentTo")} <span className="font-extrabold text-foreground">{selectedCountry.flag} {selectedCountry.code} {phone}</span>
            </p>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("auth.enterOtp")}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleVerifyOtp();
                  }
                }}
                maxLength={6}
                className="pl-10 h-14 rounded-2xl border-2 border-border/40 bg-muted/40 text-center tracking-[0.5em] font-extrabold text-lg focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all duration-200"
              />
            </div>
            <Button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-extrabold text-base shadow-lg hover:opacity-90 transition-all active:scale-[0.98]"
            >
              {loading ? t("auth.verifying") : t("auth.verifyOtp")}
            </Button>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t("auth.or")}</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* Google Sign In */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          variant="outline"
          className="w-full h-12 rounded-2xl border-2 border-border/50 font-bold text-sm gap-2.5 hover:bg-muted/50 transition-all active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {googleLoading ? t("auth.pleaseWait") : t("auth.continueGoogle")}
        </Button>

        {/* Footer */}
        <p className="text-center text-[11px] text-muted-foreground mt-3.5 leading-relaxed">
          {t("auth.terms")}{" "}
          <button onClick={() => navigate("/terms")} className="font-bold text-foreground underline underline-offset-2">{t("auth.termsLink")}</button> &{" "}
          <button onClick={() => navigate("/privacy-policy")} className="font-bold text-foreground underline underline-offset-2">{t("auth.privacyLink") || "Privacy Policy"}</button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
