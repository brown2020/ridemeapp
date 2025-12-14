import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Segment, Vec2, LineType } from "@/lib/linerider/math";
import { clamp, distPointToSegment, v } from "@/lib/linerider/math";
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
import type { CharacterType } from "@/lib/linerider/characters";

export type ToolMode = "draw" | "pan" | "erase";

export type { Camera, Viewport };

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
  clearTrack: () => void;
  addSegment: (a: Vec2, b: Vec2) => void;
  eraseAt: (p: Vec2, radiusWorld: number) => void;
  addSegments: (segments: Array<Readonly<{ a: Vec2; b: Vec2 }>>) => void;
  erasePath: (points: Vec2[], radiusWorld: number) => void;

  panByScreenDelta: (deltaScreen: Vec2) => void;
  zoomAt: (cursorScreen: Vec2, viewport: Viewport, zoomFactor: number) => void;
  setCameraPos: (pos: Vec2) => void;

  togglePlaying: () => void;
  setPlaying: (isPlaying: boolean) => void;
  resetRider: () => void;
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

  /** Rebuild spatial hash cache */
  rebuildSpatialHash: () => void;
}>;

export type LineriderStore = LineriderState & LineriderActions;

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_CAMERA: Camera = { pos: { x: 0, y: -50 }, zoom: 1.5 };
const DEFAULT_RIDER_START: Vec2 = { x: 0, y: -100 };
const DEFAULT_SETTINGS: LineriderSettings = {
  isGridVisible: true,
  isCameraFollowing: true,
  playbackSpeed: 1,
};
const SPATIAL_CELL_SIZE = 200;

export const useLineriderStore = create<LineriderStore>()(
  subscribeWithSelector((set, get) => ({
    tool: "draw",
    lineType: "normal",
    segments: [],
    history: [],
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

    pushHistory: () => set((s) => ({ history: [...s.history, s.segments] })),

    undo: () =>
      set((s) => {
        if (s.history.length === 0) return s;
        const nextHistory = s.history.slice(0, -1);
        const previousSegments = s.history[s.history.length - 1] ?? [];
        return {
          history: nextHistory,
          segments: previousSegments,
          trackVersion: s.trackVersion + 1,
        };
      }),

    clearTrack: () =>
      set((s) => {
        if (s.segments.length === 0) return s;
        return {
          history: [...s.history, s.segments],
          segments: [],
          trackVersion: s.trackVersion + 1,
        };
      }),

    addSegment: (a, b) =>
      set((s) => ({
        history: [...s.history, s.segments],
        segments: [...s.segments, { id: makeId(), a, b, type: s.lineType }],
        trackVersion: s.trackVersion + 1,
      })),

    eraseAt: (p, radiusWorld) =>
      set((s) => {
        const nextSegments = s.segments.filter(
          (seg) => distPointToSegment(p, seg.a, seg.b) > radiusWorld
        );
        if (nextSegments.length === s.segments.length) return s;
        return {
          history: [...s.history, s.segments],
          segments: nextSegments,
          trackVersion: s.trackVersion + 1,
        };
      }),

    addSegments: (segments) =>
      set((s) => {
        if (segments.length === 0) return s;
        return {
          history: [...s.history, s.segments],
          segments: [
            ...s.segments,
            ...segments.map((seg) => ({
              id: makeId(),
              ...seg,
              type: s.lineType,
            })),
          ],
          trackVersion: s.trackVersion + 1,
        };
      }),

    erasePath: (points, radiusWorld) =>
      set((s) => {
        if (points.length === 0) return s;
        const keep = (seg: Segment) => {
          for (const p of points) {
            if (distPointToSegment(p, seg.a, seg.b) <= radiusWorld)
              return false;
          }
          return true;
        };
        const nextSegments = s.segments.filter(keep);
        if (nextSegments.length === s.segments.length) return s;
        return {
          history: [...s.history, s.segments],
          segments: nextSegments,
          trackVersion: s.trackVersion + 1,
        };
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
        const nextZoom = clamp(s.camera.zoom * zoomFactor, 0.05, 20);
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

    resetRider: () =>
      set((s) => ({
        isPlaying: false,
        rider: createSimpleRider(s.riderStart),
        elapsedTime: 0,
      })),

    setRiderStart: (p) =>
      set((s) => ({
        riderStart: p,
        isPlaying: false,
        rider: createSimpleRider(p),
        elapsedTime: 0,
      })),

    stepSimulation: (dt: number) => {
      const s = get();

      // Ensure spatial hash is up to date
      if (s.spatialHashVersion !== s.trackVersion) {
        get().rebuildSpatialHash();
      }

      const newRider = stepPhysics(
        s.rider,
        s.segments,
        get().spatialHash,
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

      set({
        rider: newRider,
        elapsedTime: s.elapsedTime + dt * s.settings.playbackSpeed,
      });

      // Update camera if following
      if (s.settings.isCameraFollowing) {
        const center = getRiderCenter(newRider);
        const cam = s.camera.pos;
        const dx = center.x - cam.x;
        const dy = center.y - cam.y;
        if (dx * dx + dy * dy > 1) {
          // Smooth camera follow
          set((state) => ({
            camera: {
              ...state.camera,
              pos: {
                x: state.camera.pos.x + dx * 0.1,
                y: state.camera.pos.y + dy * 0.1,
              },
            },
          }));
        }
      }
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

    setPlaybackSpeed: (speed) =>
      set((s) => ({ settings: { ...s.settings, playbackSpeed: speed } })),

    setCharacter: (character) => set({ character }),

    resetCamera: () =>
      set((s) => ({
        camera: DEFAULT_CAMERA,
        rider: createSimpleRider(s.riderStart),
        elapsedTime: 0,
        isPlaying: false,
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
