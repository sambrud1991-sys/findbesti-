// Shared helpers for local age-gate / terms consent stored in the browser.
// Kept small and pure so it can be unit tested and reused.

export const CONSENT_KEYS = {
  ageVerified: "findbesti_age_verified",
  ageVerifiedAt: "findbesti_age_verified_at",
  termsAcceptedAt: "findbesti_terms_accepted_at",
} as const;

export const consentSyncKey = (userId: string) =>
  `findbesti_consent_synced_${userId}`;

export const hasLocalAgeConsent = () =>
  localStorage.getItem(CONSENT_KEYS.ageVerified) === "true";

export const saveLocalConsent = (nowIso: string = new Date().toISOString()) => {
  localStorage.setItem(CONSENT_KEYS.ageVerified, "true");
  localStorage.setItem(CONSENT_KEYS.ageVerifiedAt, nowIso);
  localStorage.setItem(CONSENT_KEYS.termsAcceptedAt, nowIso);
};

export const clearLocalConsent = (userId?: string) => {
  localStorage.removeItem(CONSENT_KEYS.ageVerified);
  localStorage.removeItem(CONSENT_KEYS.ageVerifiedAt);
  localStorage.removeItem(CONSENT_KEYS.termsAcceptedAt);
  if (userId) sessionStorage.removeItem(consentSyncKey(userId));
};
