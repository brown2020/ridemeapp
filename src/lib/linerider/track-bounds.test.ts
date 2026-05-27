import { describe, expect, it } from "vitest";
import { v, type Segment } from "./math";
import { computeTrackBounds, computeTrackOverviewCamera } from "./track-bounds";

describe("computeTrackBounds", () => {
  it("includes segment endpoints and padding", () => {
    const segments: Segment[] = [
      { id: "1", a: v(0, 0), b: v(100, 50), type: "normal" },
    ];
    const bounds = computeTrackBounds(segments, v(-10, -10), 10);
    expect(bounds.minX).toBe(-20);
    expect(bounds.maxX).toBe(110);
    expect(bounds.minY).toBe(-20);
    expect(bounds.maxY).toBe(60);
  });
});

describe("computeTrackOverviewCamera", () => {
  it("centers camera on track midpoint", () => {
    const segments: Segment[] = [
      { id: "1", a: v(0, 0), b: v(100, 0), type: "normal" },
    ];
    const camera = computeTrackOverviewCamera(
      segments,
      v(50, 0),
      { width: 800, height: 600 },
      0
    );
    expect(camera.pos.x).toBeCloseTo(50, 5);
    expect(camera.pos.y).toBeCloseTo(0, 5);
    expect(camera.zoom).toBeGreaterThan(0);
  });
});
