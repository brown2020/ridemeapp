import type { Segment, Vec2 } from "./math";
import type { Camera, Viewport } from "./types";
import { clamp } from "./math";
import { ZOOM } from "./constants";

export type TrackBounds = Readonly<{
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}>;

const DEFAULT_EMPTY_SPAN = 200;
const FIT_MARGIN = 0.9;

/** Collect axis-aligned bounds of all segment endpoints and rider start. */
export function computeTrackBounds(
  segments: readonly Segment[],
  riderStart: Vec2,
  paddingWorld: number
): TrackBounds {
  let minX = riderStart.x;
  let maxX = riderStart.x;
  let minY = riderStart.y;
  let maxY = riderStart.y;

  for (const seg of segments) {
    for (const p of [seg.a, seg.b]) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
  }

  if (segments.length === 0) {
    const half = DEFAULT_EMPTY_SPAN / 2;
    minX = riderStart.x - half;
    maxX = riderStart.x + half;
    minY = riderStart.y - half;
    maxY = riderStart.y + half;
  }

  return {
    minX: minX - paddingWorld,
    maxX: maxX + paddingWorld,
    minY: minY - paddingWorld,
    maxY: maxY + paddingWorld,
  };
}

/** Camera position and zoom to fit track bounds in the viewport. */
export function computeTrackOverviewCamera(
  segments: readonly Segment[],
  riderStart: Vec2,
  viewport: Viewport,
  paddingWorld = 40
): Camera {
  const bounds = computeTrackBounds(segments, riderStart, paddingWorld);
  const worldWidth = Math.max(bounds.maxX - bounds.minX, 1);
  const worldHeight = Math.max(bounds.maxY - bounds.minY, 1);

  const zoom = clamp(
    Math.min(
      (viewport.width / worldWidth) * FIT_MARGIN,
      (viewport.height / worldHeight) * FIT_MARGIN
    ),
    ZOOM.MIN,
    ZOOM.MAX
  );

  return {
    pos: {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    },
    zoom,
  };
}
