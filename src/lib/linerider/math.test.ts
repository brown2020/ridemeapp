import { describe, expect, it } from "vitest";
import {
  closestPointOnSegment,
  distPointToSegment,
  clamp,
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
