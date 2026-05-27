import { describe, expect, it } from "vitest";
import { parseCloudTrackDocument, cloudTrackToTrackFile } from "./tracks";

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
