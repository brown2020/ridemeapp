import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MAX_TRACK_SEGMENTS } from "../src/lib/linerider/track-file";

const root = path.resolve(__dirname, "..");

describe("security rules and headers", () => {
  const firestore = readFileSync(path.join(root, "firestore.rules"), "utf8");
  const storage = readFileSync(path.join(root, "storage.rules"), "utf8");
  const nextConfig = readFileSync(path.join(root, "next.config.mjs"), "utf8");

  it("caps new tracks at 50 slot ids and keeps segment payloads off the list document", () => {
    expect(firestore).toContain("slot-(?:[0-9]|[1-4][0-9])");
    expect(firestore).toContain("isTrackSlot()");
    expect(firestore).toContain("match /parts/{partId}");
    expect(firestore).toContain(`data.segmentCount <= ${MAX_TRACK_SEGMENTS}`);
    expect(firestore).toContain(`data.segments.size() <= ${MAX_TRACK_SEGMENTS}`);
    expect(firestore).not.toMatch(/match \/settings\//);
  });

  it("requires https profile photos", () => {
    expect(firestore).toContain("url.matches('https://.+')");
    expect(firestore).toContain("url.size() <= 2048");
  });

  it("allows bitmap storage writes and explicit deletes", () => {
    expect(storage).toContain("image/(png|jpeg|webp|gif)");
    expect(storage).not.toContain("image/.*");
    expect(storage).toContain("allow delete: if isOwner(uid);");
  });

  it("sends a content security policy", () => {
    expect(nextConfig).toContain('key: "Content-Security-Policy"');
    expect(nextConfig).toContain("default-src 'self'");
    expect(nextConfig).toContain("object-src 'none'");
  });
});
