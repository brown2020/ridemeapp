/**
 * Centralized constants for the linerider physics engine and UI
 */

/** Fixed timestep for physics simulation (60fps) */
export const PHYSICS_DT = 1 / 60;

/** Spatial hash cell size for collision detection */
export const SPATIAL_CELL_SIZE = 200;

/** Valid playback speeds */
export const PLAYBACK_SPEEDS = [0.25, 0.5, 1, 2, 4] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

/** Zoom limits */
export const ZOOM = {
  MIN: 0.2,
  MAX: 5,
  DEFAULT: 1.5,
} as const;
