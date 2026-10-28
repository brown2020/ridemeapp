export type FrameSchedule =
  | { action: "defer" }
  | { action: "keep" }
  | { action: "queue"; resetClock: true };

/**
 * Store updates inside a frame must not queue a second animation callback.
 * A frame is queued only from outside the loop, and only when none is pending.
 */
export function planFrameSchedule(input: {
  insideFrame: boolean;
  hasQueuedFrame: boolean;
}): FrameSchedule {
  if (input.insideFrame) return { action: "defer" };
  if (input.hasQueuedFrame) return { action: "keep" };
  return { action: "queue", resetClock: true };
}
