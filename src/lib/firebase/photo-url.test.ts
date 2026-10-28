import { describe, expect, it } from "vitest";
import { isSafePhotoUrl, sanitizePhotoUrl } from "./photo-url";

describe("photo URLs", () => {
  it("allows https Google profile photos", () => {
    const url = "https://lh3.googleusercontent.com/a/example=s96-c";
    expect(isSafePhotoUrl(url)).toBe(true);
    expect(sanitizePhotoUrl(url)).toBe(url);
  });

  it("rejects non-https, unknown hosts, and embedded credentials", () => {
    expect(isSafePhotoUrl("http://lh3.googleusercontent.com/a")).toBe(false);
    expect(isSafePhotoUrl("javascript:alert(1)")).toBe(false);
    expect(isSafePhotoUrl("https://evil.example/photo.png")).toBe(false);
    expect(isSafePhotoUrl("https://user:pass@lh3.googleusercontent.com/a")).toBe(
      false
    );
    expect(sanitizePhotoUrl("https://evil.example/photo.png")).toBeNull();
  });
});
