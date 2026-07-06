import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AgeGate from "@/components/AgeGate";
import { CONSENT_KEYS } from "@/lib/consent";

const renderGate = (onConfirm = vi.fn()) =>
  render(
    <MemoryRouter>
      <AgeGate onConfirm={onConfirm} />
    </MemoryRouter>
  );

describe("AgeGate — blocked access before login", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("blocks under-18 users with an Access Restricted screen", () => {
    renderGate();
    fireEvent.click(screen.getByRole("button", { name: /under 18/i }));
    expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
    expect(localStorage.getItem(CONSENT_KEYS.ageVerified)).toBeNull();
  });

  it("keeps Continue disabled until the checkbox is ticked", () => {
    renderGate();
    const btn = screen.getByRole("button", { name: /18 or older/i });
    expect(btn).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(btn).not.toBeDisabled();
  });

  it("persists consent and calls onConfirm when user accepts", () => {
    const onConfirm = vi.fn();
    renderGate(onConfirm);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /18 or older/i }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(localStorage.getItem(CONSENT_KEYS.ageVerified)).toBe("true");
    expect(localStorage.getItem(CONSENT_KEYS.ageVerifiedAt)).toBeTruthy();
    expect(localStorage.getItem(CONSENT_KEYS.termsAcceptedAt)).toBeTruthy();
  });
});
