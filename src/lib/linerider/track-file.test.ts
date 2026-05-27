import { describe, expect, it } from "vitest";
import { v, type Segment } from "./math";
import {
  parseTrackFile,
  serializeTrackFile,
  TRACK_FILE_VERSION,
} from "./track-file";

describe("track-file", () => {
  const sampleSegments: Segment[] = [
    { id: "1", a: v(0, 0), b: v(10, 5), type: "normal" },
    { id: "2", a: v(10, 5), b: v(20, 0), type: "accel" },
  ];

  it("round-trips track data", () => {
    const json = serializeTrackFile(
      sampleSegments,
      v(0, -100),
      "snowboarder",
      "Test Track"
    );
    const result = parseTrackFile(json);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.version).toBe(TRACK_FILE_VERSION);
    expect(result.data.name).toBe("Test Track");
    expect(result.data.segments).toHaveLength(2);
    expect(result.data.segments[0]?.type).toBe("normal");
    expect(result.data.character).toBe("snowboarder");
    expect(result.data.riderStart).toEqual({ x: 0, y: -100 });
  });

  it("rejects invalid JSON", () => {
    expect(parseTrackFile("{")).toEqual({
      ok: false,
      error: "File is not valid JSON.",
    });
  });

  it("rejects wrong version", () => {
    const json = JSON.stringify({
      version: 99,
      name: "X",
      segments: [],
      riderStart: { x: 0, y: 0 },
      character: "ball",
    });
    const result = parseTrackFile(json);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("Unsupported track version");
  });

  it("rejects corrupt segment", () => {
    const json = JSON.stringify({
      version: TRACK_FILE_VERSION,
      name: "X",
      segments: [{ a: { x: 0 }, b: { x: 1, y: 0 }, type: "normal" }],
      riderStart: { x: 0, y: 0 },
      character: "ball",
    });
    expect(parseTrackFile(json).ok).toBe(false);
  });
});
