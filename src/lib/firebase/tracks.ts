import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  runTransaction,
  query,
  orderBy,
  limit,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "./config";
import type { Segment, Vec2 } from "@/lib/linerider/math";
import type { CharacterType } from "@/lib/linerider/characters";
import type { TrackFileV1 } from "@/lib/linerider/track-file";
import {
  isTrackCoordinate,
  TRACK_FILE_VERSION,
  MAX_TRACK_NAME_LENGTH,
  MAX_TRACK_SEGMENTS,
} from "@/lib/linerider/track-file";
import {
  decodeSegments,
  encodeSegments,
  parseCloudCharacter,
  parseRiderStart,
} from "@/lib/linerider/track-encoding";
import {
  firstFreeTrackSlot,
  MAX_USER_TRACKS,
} from "./track-slots";

export { MAX_USER_TRACKS };

/** JSON length ceiling so the segments document stays under Firestore's 1 MiB limit. */
export const MAX_CLOUD_TRACK_JSON_BYTES = 900_000;

export class TrackClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TrackClientError";
  }
}

export type CloudTrackSummary = Readonly<{
  id: string;
  name: string;
  segmentCount: number;
  updatedAt: Date | null;
  /** Present when the document cannot be loaded; the row can still be deleted. */
  unreadable?: boolean;
}>;

export type CloudTrackDocument = Readonly<{
  name: string;
  version: typeof TRACK_FILE_VERSION;
  segmentCount: number;
  segments: ReturnType<typeof encodeSegments>;
  riderStart: Vec2;
  character: CharacterType;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}>;

function tracksCollection(uid: string) {
  return collection(getFirebaseDb(), "users", uid, "tracks");
}

function normalizeTrackName(name: string): string {
  const trimmed = name.trim().slice(0, MAX_TRACK_NAME_LENGTH);
  return trimmed.length > 0 ? trimmed : "Untitled Track";
}

function assertSegmentsSavable(segments: readonly Segment[]) {
  if (segments.length > MAX_TRACK_SEGMENTS) {
    throw new TrackClientError(
      `Tracks can include at most ${MAX_TRACK_SEGMENTS} lines.`
    );
  }
  for (const seg of segments) {
    if (
      !isTrackCoordinate(seg.a.x) ||
      !isTrackCoordinate(seg.a.y) ||
      !isTrackCoordinate(seg.b.x) ||
      !isTrackCoordinate(seg.b.y)
    ) {
      throw new TrackClientError("A line is too far from the origin to save.");
    }
  }
  const encoded = encodeSegments(segments);
  if (JSON.stringify(encoded).length > MAX_CLOUD_TRACK_JSON_BYTES) {
    throw new TrackClientError("Track is too large to save to the cloud.");
  }
  return encoded;
}

function buildTrackWrite(
  name: string,
  segments: readonly Segment[],
  riderStart: Vec2,
  character: CharacterType
) {
  const encoded = assertSegmentsSavable(segments);
  return {
    encoded,
    meta: {
      name: normalizeTrackName(name),
      version: TRACK_FILE_VERSION,
      segmentCount: encoded.length,
      riderStart: { x: riderStart.x, y: riderStart.y },
      character,
      updatedAt: serverTimestamp(),
    },
  };
}

function firebaseErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const code = (error as { code: unknown }).code;
  if (typeof code !== "string" || code.length === 0) return null;
  return code.startsWith("firestore/") ? code.slice("firestore/".length) : code;
}

function firebaseErrorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "Unknown error";
}

/** Console log of the Firestore code and message. The UI still gets a short line. */
export function logTrackError(operation: string, error: unknown): void {
  console.error(
    `[tracks] ${operation} failed`,
    firebaseErrorCode(error) ?? "unknown",
    firebaseErrorMessage(error)
  );
}

export function toUserTrackMessage(error: unknown, fallback: string): string {
  if (error instanceof TrackClientError) return error.message;
  const code = firebaseErrorCode(error);
  if (!code) return fallback;
  const lead = fallback.replace(/\.$/, "");
  if (code === "permission-denied") {
    return `${lead} (${code}). Firestore rules rejected the request.`;
  }
  return `${lead} (${code}).`;
}

const UNREADABLE_TRACK_NAME = "Unreadable track";

export function parseTrackSummary(id: string, raw: unknown): CloudTrackSummary {
  if (!raw || typeof raw !== "object") {
    return {
      id,
      name: UNREADABLE_TRACK_NAME,
      segmentCount: 0,
      updatedAt: null,
      unreadable: true,
    };
  }
  const data = raw as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const segmentCount =
    typeof data.segmentCount === "number" && Number.isInteger(data.segmentCount)
      ? data.segmentCount
      : null;
  if (
    !name ||
    data.version !== TRACK_FILE_VERSION ||
    segmentCount === null ||
    segmentCount < 0 ||
    segmentCount > MAX_TRACK_SEGMENTS
  ) {
    return {
      id,
      name: name || UNREADABLE_TRACK_NAME,
      segmentCount: 0,
      updatedAt: null,
      unreadable: true,
    };
  }
  const updatedAtValue = data.updatedAt;
  const updatedAt =
    updatedAtValue &&
    typeof updatedAtValue === "object" &&
    "toDate" in updatedAtValue &&
    typeof (updatedAtValue as Timestamp).toDate === "function"
      ? (updatedAtValue as Timestamp).toDate()
      : null;
  return { id, name, segmentCount, updatedAt };
}

export function parseCloudTrackDocument(
  id: string,
  raw: unknown
): CloudTrackDocument | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;

  if (typeof data.name !== "string" || data.name.trim().length === 0) {
    return null;
  }
  if (data.version !== TRACK_FILE_VERSION) return null;
  if (typeof data.segmentCount !== "number" || !Number.isInteger(data.segmentCount)) {
    return null;
  }

  const segments = decodeSegments(data.segments);
  if (!segments || segments.length !== data.segmentCount) return null;

  const riderStart = parseRiderStart(data.riderStart);
  const character = parseCloudCharacter(data.character);
  if (!riderStart || !character) return null;

  return {
    name: data.name.trim(),
    version: TRACK_FILE_VERSION,
    segmentCount: data.segmentCount,
    segments: encodeSegments(
      segments.map((seg, i) => ({
        id: `parsed-${i}`,
        ...seg,
      }))
    ),
    riderStart,
    character,
    createdAt: (data.createdAt as Timestamp) ?? null,
    updatedAt: (data.updatedAt as Timestamp) ?? null,
  };
}

export function cloudTrackToTrackFile(doc: CloudTrackDocument): TrackFileV1 {
  const segments = decodeSegments(doc.segments);
  if (!segments) {
    throw new Error("Invalid cloud track segments");
  }
  return {
    version: TRACK_FILE_VERSION,
    name: doc.name,
    segments,
    riderStart: doc.riderStart,
    character: doc.character,
  };
}

export async function listUserTracks(uid: string): Promise<CloudTrackSummary[]> {
  const q = query(
    tracksCollection(uid),
    orderBy("updatedAt", "desc"),
    limit(MAX_USER_TRACKS)
  );
  const snap = await getDocs(q);
  const items: CloudTrackSummary[] = [];

  for (const docSnap of snap.docs) {
    items.push(parseTrackSummary(docSnap.id, docSnap.data()));
  }

  return items;
}

export async function getUserTrack(
  uid: string,
  trackId: string
): Promise<CloudTrackDocument | null> {
  const ref = doc(getFirebaseDb(), "users", uid, "tracks", trackId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  let segments: unknown = data.segments;
  if (!Array.isArray(segments)) {
    const partSnap = await getDoc(doc(ref, "parts", "segments"));
    segments = partSnap.exists() ? partSnap.data().segments : undefined;
  }
  const parsed = parseCloudTrackDocument(snap.id, { ...data, segments });
  if (!parsed) {
    throw new TrackClientError("This track could not be read.");
  }
  return parsed;
}

async function commitTrackWrite(
  uid: string,
  trackId: string,
  name: string,
  segments: readonly Segment[],
  riderStart: Vec2,
  character: CharacterType,
  createdAt: ReturnType<typeof serverTimestamp> | Timestamp
): Promise<void> {
  const { encoded, meta } = buildTrackWrite(name, segments, riderStart, character);
  const db = getFirebaseDb();
  const ref = doc(db, "users", uid, "tracks", trackId);
  const batch = writeBatch(db);
  batch.set(ref, { ...meta, createdAt });
  batch.set(doc(ref, "parts", "segments"), { segments: encoded });
  await batch.commit();
}

export async function countUserTracks(uid: string): Promise<number> {
  const snap = await getDocs(
    query(tracksCollection(uid), limit(MAX_USER_TRACKS + 1))
  );
  return snap.size;
}

export async function createUserTrack(
  uid: string,
  name: string,
  segments: readonly Segment[],
  riderStart: Vec2,
  character: CharacterType
): Promise<string> {
  const snap = await getDocs(
    query(tracksCollection(uid), limit(MAX_USER_TRACKS + 1))
  );
  if (snap.size >= MAX_USER_TRACKS) {
    throw new TrackClientError(`You can save at most ${MAX_USER_TRACKS} tracks.`);
  }
  const slot = firstFreeTrackSlot(snap.docs.map((item) => item.id));
  if (!slot) {
    throw new TrackClientError(`You can save at most ${MAX_USER_TRACKS} tracks.`);
  }

  const db = getFirebaseDb();
  const ref = doc(db, "users", uid, "tracks", slot);
  const { encoded, meta } = buildTrackWrite(name, segments, riderStart, character);
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists()) {
      throw new TrackClientError("That save slot was just taken. Try again.");
    }
    transaction.set(ref, { ...meta, createdAt: serverTimestamp() });
    transaction.set(doc(ref, "parts", "segments"), { segments: encoded });
  });
  return slot;
}

export async function updateUserTrack(
  uid: string,
  trackId: string,
  name: string,
  segments: readonly Segment[],
  riderStart: Vec2,
  character: CharacterType
): Promise<void> {
  const ref = doc(getFirebaseDb(), "users", uid, "tracks", trackId);
  const existing = await getDoc(ref);
  if (!existing.exists()) {
    throw new TrackClientError("Track not found.");
  }

  const createdAt = existing.data()?.createdAt ?? serverTimestamp();
  await commitTrackWrite(
    uid,
    trackId,
    name,
    segments,
    riderStart,
    character,
    createdAt
  );
}

export async function deleteUserTrack(
  uid: string,
  trackId: string
): Promise<void> {
  const db = getFirebaseDb();
  const ref = doc(db, "users", uid, "tracks", trackId);
  const batch = writeBatch(db);
  batch.delete(doc(ref, "parts", "segments"));
  batch.delete(ref);
  await batch.commit();
}
