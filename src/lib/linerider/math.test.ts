import { describe, expect, it } from "vitest";
import {
  closestPointOnSegment,
  distPointToSegment,
  clamp,
  snapLineEndpoint,
  v,
} from "./math";

describe("closestPointOnSegment", () => {
  it("returns t=0 at segment start when point is at a", () => {
    const result = closestPointOnSegment(v(0, 0), v(0, 0), v(10, 0));
    expect(result.t).toBe(0);
    expect(result.point).toEqual({ x: 0, y: 0 });
    expect(result.dist2).toBe(0);
  });

  it("returns t=1 at segment end when point is at b", () => {
    const result = closestPointOnSegment(v(10, 0), v(0, 0), v(10, 0));
    expect(result.t).toBe(1);
    expect(result.point).toEqual({ x: 10, y: 0 });
    expect(result.dist2).toBe(0);
  });

  it("clamps t to segment for points beyond b", () => {
    const result = closestPointOnSegment(v(20, 0), v(0, 0), v(10, 0));
    expect(result.t).toBe(1);
    expect(result.dist2).toBeCloseTo(100, 5);
  });
});

describe("distPointToSegment", () => {
  it("returns perpendicular distance to segment midpoint", () => {
    expect(distPointToSegment(v(5, 5), v(0, 0), v(10, 0))).toBeCloseTo(5, 5);
  });
});

describe("clamp", () => {
  it("clamps values to range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe("snapLineEndpoint", () => {
  it("returns end unchanged when snap is disabled", () => {
    const end = v(10, 5);
    expect(snapLineEndpoint(v(0, 0), end, false)).toEqual(end);
  });

  it("snaps to horizontal when shift snapping near 0°", () => {
    const end = v(100, 5);
    const snapped = snapLineEndpoint(v(0, 0), end, true);
    expect(snapped.y).toBeCloseTo(0, 5);
    expect(Math.hypot(snapped.x, snapped.y)).toBeCloseTo(
      Math.hypot(end.x, end.y),
      5
    );
  });

  it("snaps to 45° for diagonal input", () => {
    const snapped = snapLineEndpoint(v(0, 0), v(100, 95), true);
    const angle = Math.atan2(snapped.y, snapped.x);
    expect(angle).toBeCloseTo(Math.PI / 4, 2);
  });
});
