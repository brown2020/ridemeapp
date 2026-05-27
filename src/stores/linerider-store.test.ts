import { beforeEach, describe, expect, it } from "vitest";
import { useLineriderStore } from "./linerider-store";
import { v } from "@/lib/linerider/math";

describe("linerider-store track edits", () => {
  beforeEach(() => {
    useLineriderStore.setState({
      segments: [
        {
          id: "seg-1",
          a: v(0, 0),
          b: v(10, 0),
          type: "normal",
        },
        {
          id: "seg-2",
          a: v(10, 0),
          b: v(20, 0),
          type: "normal",
        },
      ],
      history: [],
      redoHistory: [],
      trackVersion: 1,
      isPlaying: true,
      elapsedTime: 5,
    });
  });

  it("clearTrack stops playback and resets rider", () => {
    useLineriderStore.getState().clearTrack();
    const state = useLineriderStore.getState();
    expect(state.segments).toHaveLength(0);
    expect(state.isPlaying).toBe(false);
    expect(state.elapsedTime).toBe(0);
  });

  it("undo stops playback", () => {
    useLineriderStore.setState({
      history: [[]],
    });
    useLineriderStore.getState().undo();
    expect(useLineriderStore.getState().isPlaying).toBe(false);
  });

  it("redo restores segments after undo", () => {
    useLineriderStore.setState({
      history: [
        [
          {
            id: "seg-1",
            a: v(0, 0),
            b: v(10, 0),
            type: "normal",
          },
        ],
      ],
      segments: [
        {
          id: "seg-1",
          a: v(0, 0),
          b: v(10, 0),
          type: "normal",
        },
        {
          id: "seg-2",
          a: v(10, 0),
          b: v(20, 0),
          type: "normal",
        },
      ],
    });

    useLineriderStore.getState().undo();
    expect(useLineriderStore.getState().segments).toHaveLength(1);

    useLineriderStore.getState().redo();
    expect(useLineriderStore.getState().segments).toHaveLength(2);
  });

  it("new draw clears redo stack", () => {
    useLineriderStore.setState({
      history: [[]],
      redoHistory: [
        [
          {
            id: "seg-1",
            a: v(0, 0),
            b: v(10, 0),
            type: "normal",
          },
          {
            id: "seg-2",
            a: v(10, 0),
            b: v(20, 0),
            type: "normal",
          },
        ],
      ],
    });

    useLineriderStore.getState().addSegment(v(30, 0), v(40, 0));
    expect(useLineriderStore.getState().redoHistory).toHaveLength(0);
  });

  it("batches erase stroke into one history entry", () => {
    useLineriderStore.getState().pushHistory();
    useLineriderStore.getState().eraseAt(v(5, 0), 2, { recordHistory: false });
    useLineriderStore.getState().eraseAt(v(15, 0), 2, { recordHistory: false });

    const afterErase = useLineriderStore.getState();
    expect(afterErase.history).toHaveLength(1);
    expect(afterErase.segments.length).toBeLessThan(2);

    useLineriderStore.getState().undo();
    expect(useLineriderStore.getState().segments).toHaveLength(2);
  });
});
