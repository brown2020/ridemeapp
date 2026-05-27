import type { Segment, Vec2, LineType } from "./math";
import { CHARACTER_TYPES, type CharacterType } from "./characters";

export const TRACK_FILE_VERSION = 1 as const;
export const MAX_TRACK_NAME_LENGTH = 100;
export const MAX_TRACK_SEGMENTS = 50_000;

const LINE_TYPES: readonly LineType[] = ["normal", "accel", "scenery"];

export type TrackFileV1 = Readonly<{
  version: typeof TRACK_FILE_VERSION;
  name: string;
  segments: ReadonlyArray<
    Readonly<{
      a: Vec2;
      b: Vec2;
      type: LineType;
    }>
  >;
  riderStart: Vec2;
  character: CharacterType;
}>;

export type TrackFileParseResult =
  | { ok: true; data: TrackFileV1 }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseVec2(value: unknown): Vec2 | null {
  if (!isRecord(value)) return null;
  const x = value.x;
  const y = value.y;
  if (!isFiniteNumber(x) || !isFiniteNumber(y)) return null;
  return { x, y };
}

function parseLineType(value: unknown): LineType | null {
  return typeof value === "string" &&
    (LINE_TYPES as readonly string[]).includes(value)
    ? (value as LineType)
    : null;
}

function parseCharacter(value: unknown): CharacterType | null {
  return typeof value === "string" &&
    (CHARACTER_TYPES as readonly string[]).includes(value)
    ? (value as CharacterType)
    : null;
}

/** Serialize current track state to a JSON string (pretty-printed). */
export function serializeTrackFile(
  segments: readonly Segment[],
  riderStart: Vec2,
  character: CharacterType,
  name: string
): string {
  const trimmedName = name.trim().slice(0, MAX_TRACK_NAME_LENGTH) || "Untitled Track";
  const payload: TrackFileV1 = {
    version: TRACK_FILE_VERSION,
    name: trimmedName,
    segments: segments.map((seg) => ({
      a: { x: seg.a.x, y: seg.a.y },
      b: { x: seg.b.x, y: seg.b.y },
      type: seg.type,
    })),
    riderStart: { x: riderStart.x, y: riderStart.y },
    character,
  };
  return JSON.stringify(payload, null, 2);
}

/** Parse and validate a track JSON file. Never throws. */
export function parseTrackFile(json: string): TrackFileParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "File is not valid JSON." };
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: "Track file must be a JSON object." };
  }

  if (parsed.version !== TRACK_FILE_VERSION) {
    return {
      ok: false,
      error: `Unsupported track version (expected ${TRACK_FILE_VERSION}).`,
    };
  }

  if (typeof parsed.name !== "string" || parsed.name.trim().length === 0) {
    return { ok: false, error: "Track name is required." };
  }
  if (parsed.name.length > MAX_TRACK_NAME_LENGTH) {
    return {
      ok: false,
      error: `Track name must be at most ${MAX_TRACK_NAME_LENGTH} characters.`,
    };
  }

  const riderStart = parseVec2(parsed.riderStart);
  if (!riderStart) {
    return { ok: false, error: "Invalid rider start position." };
  }

  const character = parseCharacter(parsed.character);
  if (!character) {
    return { ok: false, error: "Invalid character." };
  }

  if (!Array.isArray(parsed.segments)) {
    return { ok: false, error: "Segments must be an array." };
  }
  if (parsed.segments.length > MAX_TRACK_SEGMENTS) {
    return {
      ok: false,
      error: `Track has too many segments (max ${MAX_TRACK_SEGMENTS}).`,
    };
  }

  const segments: Array<{
    a: Vec2;
    b: Vec2;
    type: LineType;
  }> = [];
  for (let i = 0; i < parsed.segments.length; i++) {
    const raw = parsed.segments[i];
    if (!isRecord(raw)) {
      return { ok: false, error: `Invalid segment at index ${i}.` };
    }
    const a = parseVec2(raw.a);
    const b = parseVec2(raw.b);
    const type = parseLineType(raw.type);
    if (!a || !b || !type) {
      return { ok: false, error: `Invalid segment at index ${i}.` };
    }
    segments.push({ a, b, type });
  }

  return {
    ok: true,
    data: {
      version: TRACK_FILE_VERSION,
      name: parsed.name.trim(),
      segments,
      riderStart,
      character,
    },
  };
}

/** Safe filename stem from track name (no extension). */
export function trackNameToFilename(name: string): string {
  const stem =
    name
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) || "track";
  return `${stem}.json`;
}
