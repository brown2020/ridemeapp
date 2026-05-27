import { describe, expect, it } from "vitest";
import { v, type Segment } from "./math";
import { decodeSegments, encodeSegments } from "./track-encoding";

describe("track-encoding", () => {
  const segments: Segment[] = [
    { id: "1", a: v(0, 0), b: v(10, 5), type: "normal" },
    { id: "2", a: v(10, 5), b: v(20, 0), type: "accel" },
  ];

  it("round-trips segments", () => {
    const encoded = encodeSegments(segments);
    expect(encoded).toEqual([
      [0, 0, 10, 5, 0],
      [10, 5, 20, 0, 1],
    ]);
    const decoded = decodeSegments(encoded);
    expect(decoded).toHaveLength(2);
    expect(decoded?.[0]?.type).toBe("normal");
    expect(decoded?.[1]?.b).toEqual({ x: 20, y: 0 });
  });

  it("rejects invalid rows", () => {
    expect(decodeSegments([[0, 0, 1, 1]])).toBeNull();
    expect(decodeSegments("bad")).toBeNull();
  });
});
