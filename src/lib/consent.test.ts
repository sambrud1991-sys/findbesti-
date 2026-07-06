import { describe, it, expect, beforeEach } from "vitest";
import {
  CONSENT_KEYS,
  consentSyncKey,
  hasLocalAgeConsent,
  saveLocalConsent,
  clearLocalConsent,
} from "@/lib/consent";

describe("consent helpers — re-verify flow", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("saveLocalConsent writes all three keys", () => {
    saveLocalConsent("2026-07-06T12:00:00Z");
    expect(localStorage.getItem(CONSENT_KEYS.ageVerified)).toBe("true");
    expect(localStorage.getItem(CONSENT_KEYS.ageVerifiedAt)).toBe("2026-07-06T12:00:00Z");
    expect(localStorage.getItem(CONSENT_KEYS.termsAcceptedAt)).toBe("2026-07-06T12:00:00Z");
    expect(hasLocalAgeConsent()).toBe(true);
  });

  it("clearLocalConsent removes every consent key and the per-user sync flag", () => {
    saveLocalConsent();
    sessionStorage.setItem(consentSyncKey("user-42"), "1");

    clearLocalConsent("user-42");

    expect(localStorage.getItem(CONSENT_KEYS.ageVerified)).toBeNull();
    expect(localStorage.getItem(CONSENT_KEYS.ageVerifiedAt)).toBeNull();
    expect(localStorage.getItem(CONSENT_KEYS.termsAcceptedAt)).toBeNull();
    expect(sessionStorage.getItem(consentSyncKey("user-42"))).toBeNull();
    expect(hasLocalAgeConsent()).toBe(false);
  });

  it("clearLocalConsent without a userId leaves other users' sync flags intact", () => {
    sessionStorage.setItem(consentSyncKey("someone-else"), "1");
    saveLocalConsent();

    clearLocalConsent();

    expect(hasLocalAgeConsent()).toBe(false);
    expect(sessionStorage.getItem(consentSyncKey("someone-else"))).toBe("1");
  });

  it("after clear, gate is effectively re-triggered (no age flag present)", () => {
    saveLocalConsent();
    expect(hasLocalAgeConsent()).toBe(true);
    clearLocalConsent("u1");
    // simulates App.tsx RootRoute re-check on next mount
    const ageVerified = localStorage.getItem(CONSENT_KEYS.ageVerified) === "true";
    expect(ageVerified).toBe(false);
  });
});
