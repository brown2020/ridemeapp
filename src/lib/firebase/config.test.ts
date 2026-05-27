import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("isFirebaseConfigured", () => {
  const envKeys = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ] as const;

  const originalEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    vi.resetModules();
    for (const key of envKeys) {
      originalEnv[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const key of envKeys) {
      const value = originalEnv[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    vi.resetModules();
  });

  it("returns false when any required env var is missing", async () => {
    for (const key of envKeys) {
      process.env[key] = "test-value";
    }
    delete process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

    const { isFirebaseConfigured } = await import("./config");
    expect(isFirebaseConfigured()).toBe(false);
  });

  it("returns true when all required env vars are set", async () => {
    for (const key of envKeys) {
      process.env[key] = "test-value";
    }

    const { isFirebaseConfigured } = await import("./config");
    expect(isFirebaseConfigured()).toBe(true);
  });
});
