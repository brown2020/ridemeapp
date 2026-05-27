export type Vec2 = Readonly<{ x: number; y: number }>;

export function v(x: number, y: number): Vec2 {
  return { x, y };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function mul(a: Vec2, s: number): Vec2 {
  return { x: a.x * s, y: a.y * s };
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function len2(a: Vec2): number {
  return dot(a, a);
}

export function len(a: Vec2): number {
  return Math.sqrt(len2(a));
}

export function normalize(a: Vec2): Vec2 {
  const l = len(a);
  if (l <= 1e-9) return { x: 1, y: 0 };
  return { x: a.x / l, y: a.y / l };
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Line types matching classic Line Rider */
export type LineType = "normal" | "accel" | "scenery";

export type Segment = Readonly<{
  id: string;
  a: Vec2;
  b: Vec2;
  /** Line type: normal (blue), accel (red), scenery (green) */
  type: LineType;
}>;

export type ClosestPointOnSegment = Readonly<{
  t: number;
  point: Vec2;
  dist2: number;
}>;

export function closestPointOnSegment(
  p: Vec2,
  a: Vec2,
  b: Vec2
): ClosestPointOnSegment {
  const ab = sub(b, a);
  const ap = sub(p, a);
  const denom = len2(ab);
  const t = denom <= 1e-9 ? 0 : clamp(dot(ap, ab) / denom, 0, 1);
  const point = add(a, mul(ab, t));
  const d = sub(p, point);
  return { t, point, dist2: len2(d) };
}

export function distPointToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  return Math.sqrt(closestPointOnSegment(p, a, b).dist2);
}

const LINE_ANGLE_SNAP_STEP_DEG = 15;

/** Snap line end to 15° increments from start when snapToAngle is true. */
export function snapLineEndpoint(
  start: Vec2,
  end: Vec2,
  snapToAngle: boolean
): Vec2 {
  if (!snapToAngle) return end;

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-9) return end;

  const stepRad = (LINE_ANGLE_SNAP_STEP_DEG * Math.PI) / 180;
  const angle = Math.atan2(dy, dx);
  const snapped = Math.round(angle / stepRad) * stepRad;

  return v(start.x + Math.cos(snapped) * dist, start.y + Math.sin(snapped) * dist);
}
