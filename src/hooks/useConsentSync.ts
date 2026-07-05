import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { APP_VERSION } from "@/config/appVersion";

/**
 * Once the user is authenticated, persist any local age-gate / terms consent
 * from localStorage into their profile row so we have an auditable record.
 * Runs once per session per user.
 */
export const useConsentSync = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const synced = sessionStorage.getItem(`findbesti_consent_synced_${user.id}`);
    if (synced) return;

    const ageAt = localStorage.getItem("findbesti_age_verified_at");
    const termsAt = localStorage.getItem("findbesti_terms_accepted_at");
    if (!ageAt && !termsAt) return;

    const patch: Record<string, string> = {};
    if (ageAt) patch.age_verified_at = ageAt;
    if (termsAt) {
      patch.terms_accepted_at = termsAt;
      patch.terms_version = APP_VERSION;
    }

    supabase
      .from("profiles")
      .update(patch)
      .eq("user_id", user.id)
      .then(({ error }) => {
        if (!error) sessionStorage.setItem(`findbesti_consent_synced_${user.id}`, "1");
      });
  }, [user]);
};
