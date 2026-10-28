import type { Segment, Vec2, LineType } from "./math";
import type { CharacterType } from "./characters";
import { CHARACTER_TYPES } from "./characters";
import type { TrackFileV1 } from "./track-file";
import { isTrackCoordinate, MAX_TRACK_SEGMENTS } from "./track-file";

/**
 * One line as a map. Firestore rejects nested arrays, so a tuple row
 * (`[ax, ay, bx, by, type]`) cannot be stored.
 */
export type EncodedSegmentRow = Readonly<{
  ax: number;
  ay: number;
  bx: number;
  by: number;
  t: number;
}>;

const LINE_TYPE_TO_INDEX: Record<LineType, number> = {
  normal: 0,
  accel: 1,
  scenery: 2,
};

const INDEX_TO_LINE_TYPE: LineType[] = ["normal", "accel", "scenery"];

export function encodeSegments(segments: readonly Segment[]): EncodedSegmentRow[] {
  return segments.map((seg) => ({
    ax: seg.a.x,
    ay: seg.a.y,
    bx: seg.b.x,
    by: seg.b.y,
    t: LINE_TYPE_TO_INDEX[seg.type],
  }));
}

function readEncodedRow(row: unknown): {
  ax: unknown;
  ay: unknown;
  bx: unknown;
  by: unknown;
  t: unknown;
} | null {
  if (Array.isArray(row)) {
    if (row.length !== 5) return null;
    const [ax, ay, bx, by, t] = row;
    return { ax, ay, bx, by, t };
  }
  if (!row || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  if (!("ax" in record) || !("ay" in record) || !("bx" in record) || !("by" in record) || !("t" in record)) {
    return null;
  }
  return record as { ax: unknown; ay: unknown; bx: unknown; by: unknown; t: unknown };
}

export function decodeSegments(
  encoded: unknown
): TrackFileV1["segments"] | null {
  if (!Array.isArray(encoded)) return null;
  if (encoded.length > MAX_TRACK_SEGMENTS) return null;

  const segments: Array<{ a: Vec2; b: Vec2; type: LineType }> = [];
  for (let i = 0; i < encoded.length; i++) {
    const row = readEncodedRow(encoded[i]);
    if (!row) return null;
    const { ax, ay, bx, by, t: typeIndex } = row;
    if (
      !isTrackCoordinate(ax) ||
      !isTrackCoordinate(ay) ||
      !isTrackCoordinate(bx) ||
      !isTrackCoordinate(by) ||
      typeof typeIndex !== "number" ||
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
  if (!isTrackCoordinate(r.x) || !isTrackCoordinate(r.y)) {
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
