import { describe, expect, it } from "vitest";
import {
  TrackClientError,
  cloudTrackToTrackFile,
  parseCloudTrackDocument,
  parseTrackSummary,
  toUserTrackMessage,
} from "./tracks";

describe("parseCloudTrackDocument", () => {
  it("accepts valid compact payload", () => {
    const parsed = parseCloudTrackDocument("t1", {
      name: "Loop",
      version: 1,
      segmentCount: 1,
      segments: [[0, 0, 10, 0, 0]],
      riderStart: { x: 0, y: -50 },
      character: "ball",
    });
    expect(parsed?.name).toBe("Loop");
    expect(parsed?.segmentCount).toBe(1);

    const file = cloudTrackToTrackFile(parsed!);
    expect(file.segments[0]?.type).toBe("normal");
  });

  it("rejects mismatched segment count", () => {
    expect(
      parseCloudTrackDocument("t1", {
        name: "X",
        version: 1,
        segmentCount: 2,
        segments: [[0, 0, 1, 1, 0]],
        riderStart: { x: 0, y: 0 },
        character: "ball",
      })
    ).toBeNull();
  });

  it("lists metadata without requiring inline segments", () => {
    expect(
      parseTrackSummary("slot-1", {
        name: "Hill",
        version: 1,
        segmentCount: 4,
        riderStart: { x: 0, y: 0 },
        character: "ball",
        updatedAt: { toDate: () => new Date("2026-01-02T00:00:00Z") },
      })
    ).toMatchObject({
      id: "slot-1",
      name: "Hill",
      segmentCount: 4,
    });
    expect(
      parseTrackSummary("slot-1", {
        name: "Hill",
        version: 1,
        segmentCount: 4,
      }).unreadable
    ).toBeUndefined();
  });

  it("keeps an unreadable document visible so it can be deleted", () => {
    expect(parseTrackSummary("slot-2", { name: "" }).unreadable).toBe(true);
  });

  it("shows only safe track errors", () => {
    expect(toUserTrackMessage(new TrackClientError("Track not found."), "no")).toBe(
      "Track not found."
    );
    expect(toUserTrackMessage(new Error("7 PERMISSION_DENIED"), "Could not save track.")).toBe(
      "Could not save track."
    );
  });

  it("rejects invalid character", () => {
    expect(
      parseCloudTrackDocument("t1", {
        name: "X",
        version: 1,
        segmentCount: 0,
        segments: [],
        riderStart: { x: 0, y: 0 },
        character: "dragon",
      })
    ).toBeNull();
  });
});
