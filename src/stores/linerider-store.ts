import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Segment, Vec2, LineType } from "@/lib/linerider/math";
import { clamp, distPointToSegment } from "@/lib/linerider/math";
import type { Camera, Viewport } from "@/lib/linerider/types";
import {
  createSimpleRider,
  stepPhysics,
  getRiderCenter,
  getRiderVelocity,
  isRiderOutOfBounds,
  type RiderState,
} from "@/lib/linerider/physics";
import {
  buildSpatialHash,
  type SpatialHash,
} from "@/lib/linerider/spatial-hash";
import {
  PLAYBACK_SPEEDS,
  SPATIAL_CELL_SIZE,
  ZOOM,
  type PlaybackSpeed,
} from "@/lib/linerider/constants";
import type { CharacterType } from "@/lib/linerider/characters";

export type ToolMode = "draw" | "line" | "pan" | "erase";

export type LineriderSettings = Readonly<{
  isGridVisible: boolean;
  isCameraFollowing: boolean;
  playbackSpeed: number;
}>;

type LineriderState = Readonly<{
  tool: ToolMode;
  lineType: LineType;
  segments: Segment[];
  history: Segment[][];
  redoHistory: Segment[][];
  trackVersion: number;

  camera: Camera;
  isPlaying: boolean;

  rider: RiderState;
  riderStart: Vec2;
  elapsedTime: number;
  character: CharacterType;

  settings: LineriderSettings;

  // Cached spatial hash for performance
  spatialHash: SpatialHash | null;
  spatialHashVersion: number;
}>;

type LineriderActions = Readonly<{
  setTool: (tool: ToolMode) => void;
  setLineType: (lineType: LineType) => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  clearTrack: () => void;
  addSegment: (a: Vec2, b: Vec2) => void;
  eraseAt: (
    p: Vec2,
    radiusWorld: number,
    options?: Readonly<{ recordHistory?: boolean }>
  ) => void;
  addSegments: (segments: Array<Readonly<{ a: Vec2; b: Vec2 }>>) => void;

  panByScreenDelta: (deltaScreen: Vec2) => void;
  zoomAt: (cursorScreen: Vec2, viewport: Viewport, zoomFactor: number) => void;
  setCameraPos: (pos: Vec2) => void;

  togglePlaying: () => void;
  setPlaying: (isPlaying: boolean) => void;
  /** Stop playback and reset rider to start (time 0, not playing) */
  stop: () => void;
  setRiderStart: (p: Vec2) => void;

  /** Step physics simulation forward by dt seconds */
  stepSimulation: (dt: number) => void;

  setGridVisible: (isGridVisible: boolean) => void;
  toggleGrid: () => void;
  setCameraFollowing: (isCameraFollowing: boolean) => void;
  toggleCameraFollowing: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setCharacter: (character: CharacterType) => void;

  /** Reset camera to default position and zoom */
  resetCamera: () => void;

  /** Zoom in by a fixed factor */
  zoomIn: () => void;

  /** Zoom out by a fixed factor */
  zoomOut: () => void;

  /** Rebuild spatial hash cache */
  rebuildSpatialHash: () => void;
}>;

export type LineriderStore = LineriderState & LineriderActions;

const MAX_HISTORY = 200;

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function commitTrackChange(
  s: Pick<LineriderState, "history" | "segments" | "trackVersion">,
  nextSegments: Segment[]
) {
  const nextHistory = [...s.history, s.segments].slice(-MAX_HISTORY);
  return {
    history: nextHistory,
    redoHistory: [] as Segment[][],
    segments: nextSegments,
    trackVersion: s.trackVersion + 1,
  };
}

function applySegmentChange(
  s: Pick<LineriderState, "history" | "segments" | "trackVersion">,
  nextSegments: Segment[],
  recordHistory: boolean
) {
  if (recordHistory) {
    return commitTrackChange(s, nextSegments);
  }
  return {
    segments: nextSegments,
    trackVersion: s.trackVersion + 1,
  };
}

const DEFAULT_CAMERA: Camera = { pos: { x: 0, y: -50 }, zoom: 1.5 };
const DEFAULT_RIDER_START: Vec2 = { x: 0, y: -100 };
const DEFAULT_SETTINGS: LineriderSettings = {
  isGridVisible: true,
  isCameraFollowing: true,
  playbackSpeed: 1,
};
export { PLAYBACK_SPEEDS, type PlaybackSpeed };

export const useLineriderStore = create<LineriderStore>()(
  subscribeWithSelector((set, get) => ({
    tool: "draw",
    lineType: "normal",
    segments: [],
    history: [],
    redoHistory: [],
    trackVersion: 0,

    camera: DEFAULT_CAMERA,
    isPlaying: false,

    rider: createSimpleRider(DEFAULT_RIDER_START),
    riderStart: DEFAULT_RIDER_START,
    elapsedTime: 0,
    character: "ball" as CharacterType,

    settings: DEFAULT_SETTINGS,

    spatialHash: null,
    spatialHashVersion: -1,

    setTool: (tool) => set({ tool }),

    setLineType: (lineType) => set({ lineType }),

    pushHistory: () =>
      set((s) => ({
        history: [...s.history, s.segments].slice(-MAX_HISTORY),
        redoHistory: [],
      })),

    undo: () =>
      set((s) => {
        if (s.history.length === 0) return s;
        const nextHistory = s.history.slice(0, -1);
        const previousSegments = s.history[s.history.length - 1] ?? [];
        return {
          history: nextHistory.slice(-MAX_HISTORY),
          redoHistory: [...s.redoHistory, s.segments].slice(-MAX_HISTORY),
          segments: previousSegments,
          trackVersion: s.trackVersion + 1,
          isPlaying: false,
        };
      }),

    redo: () =>
      set((s) => {
        if (s.redoHistory.length === 0) return s;
        const nextRedo = s.redoHistory.slice(0, -1);
        const nextSegments = s.redoHistory[s.redoHistory.length - 1] ?? [];
        return {
          history: [...s.history, s.segments].slice(-MAX_HISTORY),
          redoHistory: nextRedo.slice(-MAX_HISTORY),
          segments: nextSegments,
          trackVersion: s.trackVersion + 1,
          isPlaying: false,
        };
      }),

    clearTrack: () =>
      set((s) => {
        if (s.segments.length === 0) return s;
        return {
          ...commitTrackChange(s, []),
          isPlaying: false,
          rider: createSimpleRider(s.riderStart),
          elapsedTime: 0,
        };
      }),

    addSegment: (a, b) =>
      set((s) =>
        commitTrackChange(s, [
          ...s.segments,
          { id: makeId(), a, b, type: s.lineType },
        ])
      ),

    eraseAt: (p, radiusWorld, options) =>
      set((s) => {
        const nextSegments = s.segments.filter(
          (seg) => distPointToSegment(p, seg.a, seg.b) > radiusWorld
        );
        if (nextSegments.length === s.segments.length) return s;
        const recordHistory = options?.recordHistory !== false;
        return applySegmentChange(s, nextSegments, recordHistory);
      }),

    addSegments: (segments) =>
      set((s) => {
        if (segments.length === 0) return s;
        return commitTrackChange(s, [
          ...s.segments,
          ...segments.map((seg) => ({
            id: makeId(),
            ...seg,
            type: s.lineType,
          })),
        ]);
      }),

    panByScreenDelta: (deltaScreen) =>
      set((s) => ({
        camera: {
          ...s.camera,
          pos: {
            x: s.camera.pos.x - deltaScreen.x / s.camera.zoom,
            y: s.camera.pos.y - deltaScreen.y / s.camera.zoom,
          },
        },
      })),

    zoomAt: (cursorScreen, viewport, zoomFactor) =>
      set((s) => {
        // Zoom limits: 0.2 (zoomed out) to 5 (zoomed in)
        const nextZoom = clamp(
          s.camera.zoom * zoomFactor,
          ZOOM.MIN,
          ZOOM.MAX
        );
        const centerScreen = { x: viewport.width / 2, y: viewport.height / 2 };
        const worldAtCursor = {
          x: (cursorScreen.x - centerScreen.x) / s.camera.zoom + s.camera.pos.x,
          y: (cursorScreen.y - centerScreen.y) / s.camera.zoom + s.camera.pos.y,
        };
        const nextPos = {
          x: worldAtCursor.x - (cursorScreen.x - centerScreen.x) / nextZoom,
          y: worldAtCursor.y - (cursorScreen.y - centerScreen.y) / nextZoom,
        };
        return { camera: { pos: nextPos, zoom: nextZoom } };
      }),

    setCameraPos: (pos) => set((s) => ({ camera: { ...s.camera, pos } })),

    togglePlaying: () => {
      const s = get();
      if (!s.isPlaying) {
        // About to start playing
        // Rebuild spatial hash if needed
        if (s.spatialHashVersion !== s.trackVersion) {
          get().rebuildSpatialHash();
        }
        // Snap camera to rider position if following is enabled
        if (s.settings.isCameraFollowing) {
          const riderPos = getRiderCenter(s.rider);
          set({
            isPlaying: true,
            camera: { ...s.camera, pos: riderPos },
          });
          return;
        }
      }
      set({ isPlaying: !s.isPlaying });
    },

    setPlaying: (isPlaying) => set({ isPlaying }),

    stop: () =>
      set((s) => ({
        isPlaying: false,
        rider: createSimpleRider(s.riderStart),
        elapsedTime: 0,
      })),

    setRiderStart: (p) =>
      set({
        riderStart: p,
        isPlaying: false,
        rider: createSimpleRider(p),
        elapsedTime: 0,
      }),

    stepSimulation: (dt: number) => {
      // Ensure spatial hash is up to date before taking the snapshot
      if (get().spatialHashVersion !== get().trackVersion) {
        get().rebuildSpatialHash();
      }

      // Take a single coherent snapshot after the rebuild
      const s = get();

      const newRider = stepPhysics(
        s.rider,
        s.segments,
        s.spatialHash,
        dt * s.settings.playbackSpeed
      );

      // Check for out of bounds - stop playing but still update rider position
      if (isRiderOutOfBounds(newRider)) {
        set({
          isPlaying: false,
          rider: newRider,
        });
        return;
      }

      // Prepare camera update if following
      let cameraUpdate: { pos: { x: number; y: number } } | null = null;
      if (s.settings.isCameraFollowing) {
        const center = getRiderCenter(newRider);
        const cam = s.camera.pos;
        const dx = center.x - cam.x;
        const dy = center.y - cam.y;
        const distSq = dx * dx + dy * dy;

        if (distSq > 1) {
          const dist = Math.sqrt(distSq);
          const snapThreshold = 500;

          if (dist > snapThreshold) {
            // Snap directly to rider
            cameraUpdate = { pos: { x: center.x, y: center.y } };
          } else {
            // Adaptive smoothing: faster follow when further away
            const smoothing = Math.min(
              0.5,
              0.15 + (dist / snapThreshold) * 0.35
            );
            cameraUpdate = {
              pos: {
                x: cam.x + dx * smoothing,
                y: cam.y + dy * smoothing,
              },
            };
          }
        }
      }

      // Batch all updates into a single set() call to minimize re-renders
      set({
        rider: newRider,
        elapsedTime: s.elapsedTime + dt * s.settings.playbackSpeed,
        ...(cameraUpdate && {
          camera: { ...s.camera, ...cameraUpdate },
        }),
      });
    },

    setGridVisible: (isGridVisible) =>
      set((s) => ({ settings: { ...s.settings, isGridVisible } })),

    toggleGrid: () =>
      set((s) => ({
        settings: { ...s.settings, isGridVisible: !s.settings.isGridVisible },
      })),

    setCameraFollowing: (isCameraFollowing) =>
      set((s) => ({ settings: { ...s.settings, isCameraFollowing } })),

    toggleCameraFollowing: () =>
      set((s) => ({
        settings: {
          ...s.settings,
          isCameraFollowing: !s.settings.isCameraFollowing,
        },
      })),

    setPlaybackSpeed: (speed) => {
      // Validate speed is in allowed values
      if (!PLAYBACK_SPEEDS.includes(speed as PlaybackSpeed)) return;
      set((s) => ({ settings: { ...s.settings, playbackSpeed: speed } }));
    },

    setCharacter: (character) => set({ character }),

    resetCamera: () =>
      set({
        camera: DEFAULT_CAMERA,
        isPlaying: false,
      }),

    zoomIn: () =>
      set((s) => ({
        camera: {
          ...s.camera,
          zoom: clamp(s.camera.zoom * 1.25, ZOOM.MIN, ZOOM.MAX),
        },
      })),

    zoomOut: () =>
      set((s) => ({
        camera: {
          ...s.camera,
          zoom: clamp(s.camera.zoom / 1.25, ZOOM.MIN, ZOOM.MAX),
        },
      })),

    rebuildSpatialHash: () => {
      const s = get();
      const hash = buildSpatialHash(s.segments, SPATIAL_CELL_SIZE);
      set({ spatialHash: hash, spatialHashVersion: s.trackVersion });
    },
  }))
);

// Export helper functions for external use
export { getRiderCenter, getRiderVelocity };
