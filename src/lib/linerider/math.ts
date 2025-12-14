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

export function perp(a: Vec2): Vec2 {
  return { x: -a.y, y: a.x };
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
