import { describe, expect, it } from "vitest";
import {
  isCanvasOverviewTarget,
  shouldPlaceRiderStart,
} from "./input-gestures";

describe("input gestures", () => {
  it("uses Shift to snap a line that is already being placed", () => {
    expect(shouldPlaceRiderStart(true, true)).toBe(false);
    expect(shouldPlaceRiderStart(true, false)).toBe(true);
    expect(shouldPlaceRiderStart(false, true)).toBe(false);
  });

  it("handles Tab overview only when the canvas is the event target", () => {
    const canvas = new EventTarget();
    const button = new EventTarget();
    expect(isCanvasOverviewTarget(canvas, canvas)).toBe(true);
    expect(isCanvasOverviewTarget(button, canvas)).toBe(false);
    expect(isCanvasOverviewTarget(null, canvas)).toBe(false);
  });
});
