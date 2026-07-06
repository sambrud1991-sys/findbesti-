import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// --- mocks ---
const updateEqMock = vi.fn();
const updateMock = vi.fn(() => ({ eq: updateEqMock }));
const fromMock = vi.fn(() => ({ update: updateMock }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (...args: unknown[]) => (fromMock as unknown as (...a: unknown[]) => unknown)(...args) },
}));

const authState: { user: { id: string } | null } = { user: null };
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: authState.user }),
}));

import { useConsentSync } from "@/hooks/useConsentSync";
import { CONSENT_KEYS, consentSyncKey } from "@/lib/consent";

const primeUpdate = (error: unknown = null) => {
  updateEqMock.mockImplementation(() => ({
    then: (cb: (r: { error: unknown }) => void) => {
      cb({ error });
      return { then: () => {} };
    },
  }));
};

describe("useConsentSync", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    fromMock.mockClear();
    updateMock.mockClear();
    updateEqMock.mockReset();
    authState.user = null;
  });

  it("does nothing when the user is not logged in", () => {
    localStorage.setItem(CONSENT_KEYS.ageVerifiedAt, "2026-01-01T00:00:00Z");
    renderHook(() => useConsentSync());
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("does nothing when no local consent is present", () => {
    authState.user = { id: "u1" };
    renderHook(() => useConsentSync());
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("syncs local consent to the profile once and sets the session flag", async () => {
    authState.user = { id: "u1" };
    localStorage.setItem(CONSENT_KEYS.ageVerifiedAt, "2026-01-01T00:00:00Z");
    localStorage.setItem(CONSENT_KEYS.termsAcceptedAt, "2026-01-02T00:00:00Z");
    primeUpdate(null);

    renderHook(() => useConsentSync());

    await waitFor(() => {
      expect(fromMock).toHaveBeenCalledWith("profiles");
      expect(updateMock).toHaveBeenCalledWith({
        age_verified_at: "2026-01-01T00:00:00Z",
        terms_accepted_at: "2026-01-02T00:00:00Z",
        terms_version: expect.any(String),
      });
      expect(updateEqMock).toHaveBeenCalledWith("user_id", "u1");
      expect(sessionStorage.getItem(consentSyncKey("u1"))).toBe("1");
    });
  });

  it("skips syncing when the session flag is already set", () => {
    authState.user = { id: "u1" };
    sessionStorage.setItem(consentSyncKey("u1"), "1");
    localStorage.setItem(CONSENT_KEYS.ageVerifiedAt, "2026-01-01T00:00:00Z");

    renderHook(() => useConsentSync());
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("does not set the session flag when the update returns an error", async () => {
    authState.user = { id: "u2" };
    localStorage.setItem(CONSENT_KEYS.ageVerifiedAt, "2026-01-01T00:00:00Z");
    primeUpdate({ message: "boom" });

    renderHook(() => useConsentSync());

    await waitFor(() => expect(updateEqMock).toHaveBeenCalled());
    expect(sessionStorage.getItem(consentSyncKey("u2"))).toBeNull();
  });
});
