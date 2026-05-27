import type { Segment, Vec2, LineType } from "./math";
import type { CharacterType } from "./characters";
import { CHARACTER_TYPES } from "./characters";
import type { TrackFileV1 } from "./track-file";
import { MAX_TRACK_SEGMENTS } from "./track-file";

/** Compact row: [ax, ay, bx, by, typeIndex] */
export type EncodedSegmentRow = [number, number, number, number, number];

const LINE_TYPE_TO_INDEX: Record<LineType, number> = {
  normal: 0,
  accel: 1,
  scenery: 2,
};

const INDEX_TO_LINE_TYPE: LineType[] = ["normal", "accel", "scenery"];

export function encodeSegments(segments: readonly Segment[]): EncodedSegmentRow[] {
  return segments.map((seg) => [
    seg.a.x,
    seg.a.y,
    seg.b.x,
    seg.b.y,
    LINE_TYPE_TO_INDEX[seg.type],
  ]);
}

export function decodeSegments(
  encoded: unknown
): TrackFileV1["segments"] | null {
  if (!Array.isArray(encoded)) return null;
  if (encoded.length > MAX_TRACK_SEGMENTS) return null;

  const segments: Array<{ a: Vec2; b: Vec2; type: LineType }> = [];
  for (let i = 0; i < encoded.length; i++) {
    const row = encoded[i];
    if (!Array.isArray(row) || row.length !== 5) return null;
    const [ax, ay, bx, by, typeIndex] = row;
    if (
      typeof ax !== "number" ||
      typeof ay !== "number" ||
      typeof bx !== "number" ||
      typeof by !== "number" ||
      typeof typeIndex !== "number" ||
      !Number.isFinite(ax) ||
      !Number.isFinite(ay) ||
      !Number.isFinite(bx) ||
      !Number.isFinite(by) ||
      !Number.isInteger(typeIndex) ||
      typeIndex < 0 ||
      typeIndex > 2
    ) {
      return null;
    }
    segments.push({
      a: { x: ax, y: ay },
      b: { x: bx, y: by },
      type: INDEX_TO_LINE_TYPE[typeIndex]!,
    });
  }
  return segments;
}

export function parseRiderStart(value: unknown): Vec2 | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Record<string, unknown>;
  if (
    typeof r.x !== "number" ||
    typeof r.y !== "number" ||
    !Number.isFinite(r.x) ||
    !Number.isFinite(r.y)
  ) {
    return null;
  }
  return { x: r.x, y: r.y };
}

export function parseCloudCharacter(value: unknown): CharacterType | null {
  return typeof value === "string" &&
    (CHARACTER_TYPES as readonly string[]).includes(value)
    ? (value as CharacterType)
    : null;
}
