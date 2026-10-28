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
      { ax: 0, ay: 0, bx: 10, by: 5, t: 0 },
      { ax: 10, ay: 5, bx: 20, by: 0, t: 1 },
    ]);
    expect(Array.isArray(encoded[0])).toBe(false);
    const decoded = decodeSegments(encoded);
    expect(decoded).toHaveLength(2);
    expect(decoded?.[0]?.type).toBe("normal");
    expect(decoded?.[1]?.b).toEqual({ x: 20, y: 0 });
  });

  it("rejects invalid rows", () => {
    expect(decodeSegments([[0, 0, 1, 1]])).toBeNull();
    expect(decodeSegments("bad")).toBeNull();
  });

  it("still reads the older tuple rows", () => {
    const decoded = decodeSegments([[0, 0, 10, 5, 0]]);
    expect(decoded?.[0]?.type).toBe("normal");
    expect(decoded?.[0]?.b).toEqual({ x: 10, y: 5 });
  });

  it("rejects coordinates outside the playable world", () => {
    expect(decodeSegments([[0, 0, 2_000_000, 0, 0]])).toBeNull();
  });
});
