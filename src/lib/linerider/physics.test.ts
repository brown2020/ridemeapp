import { describe, expect, it } from "vitest";
import { v } from "./math";
import {
  cloneRider,
  createSimpleRider,
  getRiderCenter,
  isRiderOutOfBounds,
} from "./physics";

describe("isRiderOutOfBounds", () => {
  it("returns false for default start position", () => {
    const rider = createSimpleRider(v(0, -100));
    expect(isRiderOutOfBounds(rider)).toBe(false);
  });

  it("returns true when rider falls below y limit", () => {
    const rider = createSimpleRider(v(0, 100_001));
    expect(isRiderOutOfBounds(rider)).toBe(true);
  });

  it("returns true when rider exceeds horizontal limits", () => {
    expect(isRiderOutOfBounds(createSimpleRider(v(-500_001, 0)))).toBe(true);
    expect(isRiderOutOfBounds(createSimpleRider(v(500_001, 0)))).toBe(true);
  });
});

describe("cloneRider", () => {
  it("produces an independent copy of rider points", () => {
    const original = createSimpleRider(v(1, 2));
    const copy = cloneRider(original);
    expect(copy.points[0].pos).toEqual(original.points[0].pos);
    expect(copy.points).not.toBe(original.points);
    expect(copy.points[0].pos).not.toBe(original.points[0].pos);
  });
});

describe("getRiderCenter", () => {
  it("returns the single ball position", () => {
    const rider = createSimpleRider(v(3, 7));
    expect(getRiderCenter(rider)).toEqual({ x: 3, y: 7 });
  });
});
