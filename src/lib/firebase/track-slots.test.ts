import { describe, expect, it } from "vitest";
import {
  firstFreeTrackSlot,
  isTrackSlotId,
  MAX_USER_TRACKS,
  trackSlotId,
} from "./track-slots";

describe("track slots", () => {
  it("allows only slot-0 through slot-49", () => {
    expect(isTrackSlotId("slot-0")).toBe(true);
    expect(isTrackSlotId("slot-49")).toBe(true);
    expect(isTrackSlotId("slot-50")).toBe(false);
    expect(isTrackSlotId("slot-09")).toBe(false);
    expect(isTrackSlotId(trackSlotId(MAX_USER_TRACKS))).toBe(false);
  });

  it("picks the lowest free slot and stops at 50", () => {
    expect(firstFreeTrackSlot(["slot-0", "legacy"])).toBe("slot-1");
    const full = Array.from({ length: MAX_USER_TRACKS }, (_, index) =>
      trackSlotId(index)
    );
    expect(firstFreeTrackSlot(full)).toBeNull();
  });
});
