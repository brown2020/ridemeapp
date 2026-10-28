import { describe, expect, it } from "vitest";
import { planFrameSchedule } from "./frame-scheduler";

describe("planFrameSchedule", () => {
  it("does not queue a second frame from inside the current one", () => {
    expect(
      planFrameSchedule({ insideFrame: true, hasQueuedFrame: false })
    ).toEqual({ action: "defer" });
  });

  it("keeps an already queued frame", () => {
    expect(
      planFrameSchedule({ insideFrame: false, hasQueuedFrame: true })
    ).toEqual({ action: "keep" });
  });

  it("queues one frame and resets the clock when idle", () => {
    expect(
      planFrameSchedule({ insideFrame: false, hasQueuedFrame: false })
    ).toEqual({ action: "queue", resetClock: true });
  });
});
