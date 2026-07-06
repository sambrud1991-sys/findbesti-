import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { APP_VERSION } from "@/config/appVersion";
import { CONSENT_KEYS, consentSyncKey } from "@/lib/consent";

/**
 * Once the user is authenticated, persist any local age-gate / terms consent
 * from localStorage into their profile row so we have an auditable record.
 * Runs once per session per user.
 */
export const useConsentSync = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const synced = sessionStorage.getItem(consentSyncKey(user.id));
    if (synced) return;

    const ageAt = localStorage.getItem(CONSENT_KEYS.ageVerifiedAt);
    const termsAt = localStorage.getItem(CONSENT_KEYS.termsAcceptedAt);
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
        if (!error) sessionStorage.setItem(consentSyncKey(user.id), "1");
      });
  }, [user]);
};

