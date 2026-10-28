import { describe, expect, it } from "vitest";
import {
  normalizeDisplayName,
  profileIdentityUpdate,
} from "./profile-fields";

describe("profile identity updates", () => {
  it("truncates a new provider name to 50 characters", () => {
    const name = "A".repeat(80);
    expect(normalizeDisplayName(name)).toHaveLength(50);
    expect(
      profileIdentityUpdate({
        isNewProfile: true,
        authDisplayName: name,
        authPhotoURL: "https://lh3.googleusercontent.com/a/photo",
      })
    ).toEqual({
      displayName: "A".repeat(50),
      photoURL: "https://lh3.googleusercontent.com/a/photo",
    });
  });

  it("does not copy the provider name over an existing profile", () => {
    expect(
      profileIdentityUpdate({
        isNewProfile: false,
        authDisplayName: "Google Name",
        authPhotoURL: "https://lh3.googleusercontent.com/a/photo",
      })
    ).toEqual({});
  });

  it("uses an explicit display name on update", () => {
    expect(
      profileIdentityUpdate({
        isNewProfile: false,
        additional: { displayName: "Rider" },
        authDisplayName: "Google Name",
        authPhotoURL: null,
      })
    ).toEqual({ displayName: "Rider" });
  });

  it("drops an unsafe photo URL", () => {
    expect(
      profileIdentityUpdate({
        isNewProfile: true,
        authDisplayName: "Ada",
        authPhotoURL: "https://evil.example/track.png",
      }).photoURL
    ).toBeNull();
  });
});
