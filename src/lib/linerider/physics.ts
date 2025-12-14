import {
  add,
  mul,
  sub,
  dot,
  len,
  len2,
  normalize,
  clamp,
  closestPointOnSegment,
  v,
  type Vec2,
  type Segment,
} from "./math";
import type { SpatialHash } from "./spatial-hash";
import { querySpatialHash } from "./spatial-hash";

/**
 * Physics constants tuned for classic Line Rider feel.
 * The original Line Rider ran at 40fps with specific gravity/friction values.
 * These are adjusted for smooth 60fps gameplay.
 */
export const PHYSICS = {
  /** Gravity in world units per tick (classic LR used ~0.175 per tick at 40fps) */
  GRAVITY: 0.25,
  /** Number of physics substeps per frame for stability */
  SUBSTEPS: 8,
  /** Rider collision radius */
  RIDER_RADIUS: 10,
  /** Friction coefficient for normal (blue) lines */
  FRICTION_NORMAL: 0.02,
  /** Friction coefficient for acceleration (red) lines - essentially frictionless */
  FRICTION_ACCEL: 0.0,
  /** Acceleration multiplier for red lines */
  ACCEL_BOOST: 0.05,
  /** Velocity damping (air resistance) - very minimal */
  AIR_RESISTANCE: 0.9995,
  /** Maximum velocity to prevent tunneling through lines */
  MAX_VELOCITY: 40,
  /** Collision iterations per substep for resolving overlaps */
  COLLISION_ITERATIONS: 4,
  /** Spatial hash query radius for collision detection */
  QUERY_RADIUS: 100,
  /** Bounce coefficient (0 = no bounce, 1 = full bounce) */
  BOUNCE: 0.0,
} as const;

/** Rider point - a single physics point in the rider */
export interface RiderPoint {
  pos: Vec2;
  prevPos: Vec2;
  friction: number;
}

/** Rider constraint - connects two points */
export interface RiderConstraint {
  p1: number;
  p2: number;
  length: number;
}

/** Complete rider state for Bosh (the sledder) */
export interface RiderState {
  /** Physics points: [sled_back, sled_front, body_bottom, body_top, arm, hand, leg, foot] */
  points: RiderPoint[];
  /** Constraints between points */
  constraints: RiderConstraint[];
  /** Whether the rider has crashed */
  crashed: boolean;
  /** Frame counter for animation/replay */
  frame: number;
}

/**
 * Creates initial rider state at the given position
 * The rider is a simplified ragdoll with key points
 */
export function createRider(startPos: Vec2): RiderState {
  // Simplified Bosh model - main points relative to start position
  const sledBack = { x: startPos.x - 10, y: startPos.y };
  const sledFront = { x: startPos.x + 10, y: startPos.y };
  const bodyBottom = { x: startPos.x - 5, y: startPos.y - 15 };
  const bodyTop = { x: startPos.x - 2, y: startPos.y - 35 };
  const shoulder = { x: startPos.x + 3, y: startPos.y - 30 };
  const hand = { x: startPos.x + 12, y: startPos.y - 20 };

  const createPoint = (
    pos: Vec2,
    friction: number = PHYSICS.FRICTION_NORMAL
  ): RiderPoint => ({
    pos: { ...pos },
    prevPos: { ...pos },
    friction,
  });

  const points: RiderPoint[] = [
    createPoint(sledBack, 0.8), // 0: sled back (contact point)
    createPoint(sledFront, 0.8), // 1: sled front (contact point)
    createPoint(bodyBottom, 0.0), // 2: body bottom (hip)
    createPoint(bodyTop, 0.0), // 3: body top (head)
    createPoint(shoulder, 0.0), // 4: shoulder
    createPoint(hand, 0.0), // 5: hand holding rope
  ];

  // Distance constraints to maintain shape
  const constraints: RiderConstraint[] = [
    // Sled
    { p1: 0, p2: 1, length: 20 },
    // Body
    { p1: 2, p2: 3, length: 20 },
    // Connect to sled
    { p1: 0, p2: 2, length: 18 },
    { p1: 1, p2: 2, length: 18 },
    // Arm
    { p1: 4, p2: 5, length: 15 },
    { p1: 3, p2: 4, length: 8 },
    // Rope to sled
    { p1: 5, p2: 1, length: 12 },
    // Stability constraints
    { p1: 0, p2: 3, length: 38 },
    { p1: 1, p2: 3, length: 35 },
  ];

  return {
    points,
    constraints,
    crashed: false,
    frame: 0,
  };
}

/**
 * Creates a simple single-point rider (ball) for simpler physics
 */
export function createSimpleRider(startPos: Vec2): RiderState {
  const createPoint = (pos: Vec2): RiderPoint => ({
    pos: { ...pos },
    prevPos: { ...pos },
    friction: PHYSICS.FRICTION_NORMAL,
  });

  return {
    points: [createPoint(startPos)],
    constraints: [],
    crashed: false,
    frame: 0,
  };
}

// Alias to avoid conflict with imported 'sub' function name in stepPhysics
const vecSub = sub;

/**
 * Step the physics simulation forward by dt seconds.
 * Uses Verlet integration for stable physics simulation.
 */
export function stepPhysics(
  rider: RiderState,
  segments: Segment[],
  spatialHash: SpatialHash | null,
  dt: number
): RiderState {
  if (rider.crashed) return rider;

  // Clone rider state for immutability
  const newPoints = rider.points.map((p) => ({
    pos: { ...p.pos },
    prevPos: { ...p.prevPos },
    friction: p.friction,
  }));

  // Scale physics by dt (normalized to 1/60 second)
  const timeScale = dt * 60;

  for (let sub = 0; sub < PHYSICS.SUBSTEPS; sub++) {
    // Apply Verlet integration with gravity
    for (const point of newPoints) {
      const velocity = vecSub(point.pos, point.prevPos);

      // Clamp velocity to prevent tunneling
      const speed = len(velocity);
      const clampedVelocity =
        speed > PHYSICS.MAX_VELOCITY
          ? mul(normalize(velocity), PHYSICS.MAX_VELOCITY)
          : velocity;

      point.prevPos = { ...point.pos };

      // Apply velocity, gravity, and air resistance
      const gravity = (PHYSICS.GRAVITY * timeScale) / PHYSICS.SUBSTEPS;
      point.pos = add(
        point.pos,
        add(mul(clampedVelocity, PHYSICS.AIR_RESISTANCE), v(0, gravity))
      );
    }

    // Solve distance constraints (for multi-point riders)
    for (let iter = 0; iter < 3; iter++) {
      for (const constraint of rider.constraints) {
        const p1 = newPoints[constraint.p1];
        const p2 = newPoints[constraint.p2];

        const delta = vecSub(p2.pos, p1.pos);
        const dist = len(delta);
        if (dist < 0.0001) continue;

        const diff = (dist - constraint.length) / dist;
        const correction = mul(delta, diff * 0.5);

        p1.pos = add(p1.pos, correction);
        p2.pos = vecSub(p2.pos, correction);
      }
    }

    // Handle line collisions
    for (let iter = 0; iter < PHYSICS.COLLISION_ITERATIONS; iter++) {
      for (const point of newPoints) {
        // Query nearby segments from spatial hash
        const candidates = spatialHash
          ? querySpatialHash(spatialHash, point.pos, PHYSICS.QUERY_RADIUS)
          : segments;

        for (const seg of candidates) {
          // Skip scenery lines - they don't have physics
          if (seg.type === "scenery") continue;

          const closest = closestPointOnSegment(point.pos, seg.a, seg.b);
          const radiusSq = PHYSICS.RIDER_RADIUS * PHYSICS.RIDER_RADIUS;

          if (closest.dist2 >= radiusSq) continue;

          const dist = Math.sqrt(closest.dist2);

          // Calculate collision normal (pointing from line to rider)
          let normal: Vec2;
          if (dist < 0.0001) {
            // Rider is exactly on line - use perpendicular based on line direction
            const lineDir = vecSub(seg.b, seg.a);
            // Use consistent normal direction (left side of line when going a->b)
            normal = normalize(v(-lineDir.y, lineDir.x));
          } else {
            normal = mul(vecSub(point.pos, closest.point), 1 / dist);
          }

          // Push rider out of collision
          const penetration = PHYSICS.RIDER_RADIUS - dist;
          point.pos = add(point.pos, mul(normal, penetration * 1.01)); // slight over-correction

          // Calculate velocity
          const velocity = vecSub(point.pos, point.prevPos);
          const tangent = normalize(vecSub(seg.b, seg.a));

          const vn = dot(velocity, normal); // velocity into surface
          const vt = dot(velocity, tangent); // velocity along surface

          // Determine friction based on line type
          const friction =
            seg.type === "accel"
              ? PHYSICS.FRICTION_ACCEL
              : PHYSICS.FRICTION_NORMAL;

          // Apply friction to tangential velocity
          const vtDamped = vt * (1 - friction);

          // Handle normal velocity (bounce or stop)
          const vnOut = vn < 0 ? -vn * PHYSICS.BOUNCE : vn;

          // Reconstruct velocity
          const newVelocity = add(mul(tangent, vtDamped), mul(normal, vnOut));
          point.prevPos = vecSub(point.pos, newVelocity);

          // Apply acceleration boost for red lines
          if (seg.type === "accel") {
            // Boost in direction of the line (a -> b)
            const accelDir = normalize(vecSub(seg.b, seg.a));
            // Only boost if moving roughly in line direction
            const alignment = dot(normalize(velocity), accelDir);
            if (alignment > -0.5) {
              const boost =
                (PHYSICS.ACCEL_BOOST * timeScale) / PHYSICS.SUBSTEPS;
              point.pos = add(point.pos, mul(accelDir, boost));
            }
          }
        }
      }
    }
  }

  return {
    points: newPoints,
    constraints: rider.constraints,
    crashed: rider.crashed,
    frame: rider.frame + 1,
  };
}

/**
 * Get the center position of the rider (for camera following)
 */
export function getRiderCenter(rider: RiderState): Vec2 {
  if (rider.points.length === 0) return v(0, 0);

  let sumX = 0;
  let sumY = 0;
  for (const point of rider.points) {
    sumX += point.pos.x;
    sumY += point.pos.y;
  }

  return v(sumX / rider.points.length, sumY / rider.points.length);
}

/**
 * Get rider velocity (average of all points)
 */
export function getRiderVelocity(rider: RiderState): Vec2 {
  if (rider.points.length === 0) return v(0, 0);

  let sumX = 0;
  let sumY = 0;
  for (const point of rider.points) {
    sumX += point.pos.x - point.prevPos.x;
    sumY += point.pos.y - point.prevPos.y;
  }

  return v(sumX / rider.points.length, sumY / rider.points.length);
}

/**
 * Check if rider is out of bounds
 * Uses very large bounds to allow for extended tracks
 */
export function isRiderOutOfBounds(rider: RiderState): boolean {
  const center = getRiderCenter(rider);
  // Allow falling very far (100,000 units down) and traveling far horizontally (±500,000)
  return center.y > 100000 || center.x < -500000 || center.x > 500000;
}
