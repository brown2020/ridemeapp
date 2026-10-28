import { describe, expect, it } from "vitest";
import {
  getAuthErrorMessage,
  isSilentPasswordResetError,
} from "./auth-errors";

describe("auth error copy", () => {
  it("does not reveal whether an email is registered", () => {
    const error = Object.assign(new Error("No account found with this email."), {
      code: "auth/user-not-found",
    });
    expect(getAuthErrorMessage(error)).toBe(
      "Invalid email or password. Please try again."
    );
    expect(getAuthErrorMessage(error)).not.toMatch(/no account/i);
  });

  it("hides raw messages for unknown codes", () => {
    const error = Object.assign(new Error("Firebase internal project leak"), {
      code: "auth/internal-error",
    });
    expect(getAuthErrorMessage(error)).toBe(
      "Something went wrong. Please try again."
    );
    expect(getAuthErrorMessage(error)).not.toContain("project leak");
  });

  it("treats a missing account on password reset as silent", () => {
    expect(
      isSilentPasswordResetError({ code: "auth/user-not-found" })
    ).toBe(true);
    expect(isSilentPasswordResetError({ code: "auth/invalid-email" })).toBe(
      false
    );
  });
});
