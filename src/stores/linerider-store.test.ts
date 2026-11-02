import { beforeEach, describe, expect, it } from "vitest";
import { useLineriderStore } from "./linerider-store";
import { v } from "@/lib/linerider/math";
import { MAX_TRACK_SEGMENTS } from "@/lib/linerider/track-file";

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
      flag: null,
      trackName: null,
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

  it("stop resets rider to start without clearing track", () => {
    useLineriderStore.setState({
      rider: {
        ...useLineriderStore.getState().rider,
        points: [
          {
            pos: { x: 50, y: 50 },
            prevPos: { x: 49, y: 49 },
            friction: 0.02,
          },
        ],
      },
      elapsedTime: 12,
      isPlaying: true,
    });

    useLineriderStore.getState().stop();
    const state = useLineriderStore.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.elapsedTime).toBe(0);
    expect(state.segments).toHaveLength(2);
    expect(state.rider.points[0].pos).toEqual({ x: 0, y: -100 });
  });

  it("resetCamera resets view only, not rider position", () => {
    useLineriderStore.setState({
      camera: { pos: { x: 200, y: 300 }, zoom: 2.5 },
      rider: {
        ...useLineriderStore.getState().rider,
        points: [
          {
            pos: { x: 50, y: 50 },
            prevPos: { x: 49, y: 49 },
            friction: 0.02,
          },
        ],
      },
      elapsedTime: 9,
      isPlaying: true,
    });

    useLineriderStore.getState().resetCamera();
    const state = useLineriderStore.getState();
    expect(state.camera).toEqual({ pos: { x: 0, y: -50 }, zoom: 1.5 });
    expect(state.isPlaying).toBe(false);
    expect(state.elapsedTime).toBe(9);
    expect(state.rider.points[0].pos).toEqual({ x: 50, y: 50 });
  });

  it("setFlag and jumpToFlag restore rider state and pause", () => {
    useLineriderStore.setState({
      elapsedTime: 7.5,
      isPlaying: true,
      rider: {
        ...useLineriderStore.getState().rider,
        points: [
          {
            pos: { x: 40, y: 20 },
            prevPos: { x: 39, y: 19 },
            friction: 0.02,
          },
        ],
      },
    });

    useLineriderStore.getState().setFlag();
    useLineriderStore.getState().stop();

    const afterStop = useLineriderStore.getState();
    expect(afterStop.flag).toBeNull();
    expect(afterStop.elapsedTime).toBe(0);

    useLineriderStore.setState({
      elapsedTime: 3,
      rider: {
        ...useLineriderStore.getState().rider,
        points: [
          {
            pos: { x: 10, y: 5 },
            prevPos: { x: 9, y: 4 },
            friction: 0.02,
          },
        ],
      },
      flag: {
        rider: {
          points: [
            {
              pos: { x: 40, y: 20 },
              prevPos: { x: 39, y: 19 },
              friction: 0.02,
            },
          ],
          constraints: [],
          crashed: false,
          frame: 0,
        },
        elapsedTime: 7.5,
      },
      isPlaying: true,
    });

    useLineriderStore.getState().jumpToFlag();
    const afterJump = useLineriderStore.getState();
    expect(afterJump.isPlaying).toBe(false);
    expect(afterJump.elapsedTime).toBe(7.5);
    expect(afterJump.rider.points[0].pos).toEqual({ x: 40, y: 20 });
  });

  it("clearTrack clears flag", () => {
    useLineriderStore.setState({
      flag: {
        rider: useLineriderStore.getState().rider,
        elapsedTime: 1,
      },
    });
    useLineriderStore.getState().clearTrack();
    expect(useLineriderStore.getState().flag).toBeNull();
  });

  it("loadTrack replaces segments and clears history", () => {
    useLineriderStore.getState().loadTrack({
      version: 1,
      name: "Imported",
      segments: [
        { a: v(1, 2), b: v(3, 4), type: "scenery" },
      ],
      riderStart: v(0, -200),
      character: "horse",
    });
    const state = useLineriderStore.getState();
    expect(state.segments).toHaveLength(1);
    expect(state.segments[0]?.type).toBe("scenery");
    expect(state.history).toHaveLength(0);
    expect(state.isPlaying).toBe(false);
    expect(state.character).toBe("horse");
    expect(state.riderStart).toEqual({ x: 0, y: -200 });
    expect(state.trackName).toBe("Imported");
  });

  it("clearTrack clears a flag when the canvas is already empty", () => {
    useLineriderStore.setState({
      segments: [],
      flag: {
        rider: useLineriderStore.getState().rider,
        elapsedTime: 2,
      },
      trackName: "Kept",
    });
    useLineriderStore.getState().clearTrack();
    const state = useLineriderStore.getState();
    expect(state.flag).toBeNull();
    expect(state.trackName).toBeNull();
  });

  it("commitEraseStroke ignores a miss and keeps redo", () => {
    const segments = useLineriderStore.getState().segments;
    useLineriderStore.setState({ redoHistory: [[]] });
    useLineriderStore.getState().commitEraseStroke(segments);
    expect(useLineriderStore.getState().history).toHaveLength(0);
    expect(useLineriderStore.getState().redoHistory).toHaveLength(1);
  });

  it("commitEraseStroke records one undo step after lines are removed", () => {
    const before = useLineriderStore.getState().segments;
    useLineriderStore.getState().eraseAt(v(5, 0), 2, { recordHistory: false });
    useLineriderStore.getState().commitEraseStroke(before);
    expect(useLineriderStore.getState().history).toHaveLength(1);
    useLineriderStore.getState().undo();
    expect(useLineriderStore.getState().segments).toHaveLength(2);
  });

  it("addSegment stops at the track line cap", () => {
    useLineriderStore.setState({
      segments: Array.from({ length: MAX_TRACK_SEGMENTS }, (_, index) => ({
        id: `s-${index}`,
        a: v(index, 0),
        b: v(index + 1, 0),
        type: "normal" as const,
      })),
    });
    useLineriderStore.getState().addSegment(v(0, 1), v(1, 1));
    expect(useLineriderStore.getState().segments).toHaveLength(MAX_TRACK_SEGMENTS);
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

describe("linerider-store playback", () => {
  beforeEach(() => {
    const rider = useLineriderStore.getState().rider;
    useLineriderStore.setState({
      segments: [],
      isPlaying: true,
      elapsedTime: 4,
      flag: null,
      settings: {
        ...useLineriderStore.getState().settings,
        isCameraFollowing: false,
        playbackSpeed: 1,
      },
      rider: {
        ...rider,
        crashed: false,
        points: [
          {
            pos: { x: 0, y: -100 },
            prevPos: { x: 0, y: -100 },
            friction: 0.02,
          },
        ],
      },
    });
  });

  it("pauses and resumes without resetting the ride", () => {
    const before = useLineriderStore.getState();
    const pos = { ...before.rider.points[0].pos };

    useLineriderStore.getState().togglePlaying();
    const paused = useLineriderStore.getState();
    expect(paused.isPlaying).toBe(false);
    expect(paused.elapsedTime).toBe(4);
    expect(paused.rider.points[0].pos).toEqual(pos);

    useLineriderStore.getState().togglePlaying();
    const resumed = useLineriderStore.getState();
    expect(resumed.isPlaying).toBe(true);
    expect(resumed.elapsedTime).toBe(4);
    expect(resumed.rider.points[0].pos).toEqual(pos);
  });

  it("steps the rider forward and scales elapsed time by playback speed", () => {
    const dt = 1 / 60;
    useLineriderStore.getState().stepSimulation(dt);
    const once = useLineriderStore.getState();
    expect(once.elapsedTime).toBeCloseTo(4 + dt);
    expect(once.rider.points[0].pos.y).toBeGreaterThan(-100);
    expect(once.isPlaying).toBe(true);

    useLineriderStore.getState().setPlaybackSpeed(3);
    expect(useLineriderStore.getState().settings.playbackSpeed).toBe(1);

    useLineriderStore.getState().setPlaybackSpeed(2);
    const elapsed = useLineriderStore.getState().elapsedTime;
    useLineriderStore.getState().stepSimulation(dt);
    expect(useLineriderStore.getState().elapsedTime).toBeCloseTo(elapsed + dt * 2);
  });

  it("pauses when the rider leaves the world bounds", () => {
    const rider = useLineriderStore.getState().rider;
    useLineriderStore.setState({
      rider: {
        ...rider,
        points: [
          {
            pos: { x: 0, y: 100_001 },
            prevPos: { x: 0, y: 100_001 },
            friction: 0.02,
          },
        ],
      },
    });

    useLineriderStore.getState().stepSimulation(1 / 60);
    const state = useLineriderStore.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.rider.points[0].pos.y).toBeGreaterThan(100_000);
  });
});
