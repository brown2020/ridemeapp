import { describe, expect, it } from "vitest";
import { buildSpatialHash } from "./spatial-hash";
import type { Segment } from "./math";

describe("buildSpatialHash", () => {
  it("indexes a short segment", () => {
    const seg: Segment = {
      id: "short",
      a: { x: 0, y: 0 },
      b: { x: 10, y: 0 },
      type: "normal",
    };
    const hash = buildSpatialHash([seg], 200);
    expect(hash.grid.size).toBeGreaterThan(0);
  });

  it("aborts a bounding box that would walk billions of cells", () => {
    const seg: Segment = {
      id: "huge",
      a: { x: 0, y: 0 },
      b: { x: 1e12, y: 1e12 },
      type: "normal",
    };
    const started = Date.now();
    const hash = buildSpatialHash([seg], 200);
    expect(Date.now() - started).toBeLessThan(200);
    expect(hash.grid.size).toBeLessThanOrEqual(2);
  });
});
