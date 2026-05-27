import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
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
import { TRACK_FILE_VERSION, MAX_TRACK_NAME_LENGTH } from "@/lib/linerider/track-file";
import {
  decodeSegments,
  encodeSegments,
  parseCloudCharacter,
  parseRiderStart,
} from "@/lib/linerider/track-encoding";

export const MAX_USER_TRACKS = 50;

export type CloudTrackSummary = Readonly<{
  id: string;
  name: string;
  segmentCount: number;
  updatedAt: Date | null;
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

function buildTrackPayload(
  name: string,
  segments: readonly Segment[],
  riderStart: Vec2,
  character: CharacterType
) {
  const encoded = encodeSegments(segments);
  return {
    name: normalizeTrackName(name),
    version: TRACK_FILE_VERSION,
    segmentCount: encoded.length,
    segments: encoded,
    riderStart: { x: riderStart.x, y: riderStart.y },
    character,
    updatedAt: serverTimestamp(),
  };
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
    const parsed = parseCloudTrackDocument(docSnap.id, docSnap.data());
    if (!parsed) continue;
    items.push({
      id: docSnap.id,
      name: parsed.name,
      segmentCount: parsed.segmentCount,
      updatedAt: parsed.updatedAt?.toDate() ?? null,
    });
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
  return parseCloudTrackDocument(snap.id, snap.data());
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
  const count = await countUserTracks(uid);
  if (count >= MAX_USER_TRACKS) {
    throw new Error(`You can save at most ${MAX_USER_TRACKS} tracks.`);
  }

  const ref = doc(tracksCollection(uid));
  await setDoc(ref, {
    ...buildTrackPayload(name, segments, riderStart, character),
    createdAt: serverTimestamp(),
  });
  return ref.id;
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
    throw new Error("Track not found.");
  }

  await setDoc(
    ref,
    {
      ...buildTrackPayload(name, segments, riderStart, character),
      createdAt: existing.data()?.createdAt ?? serverTimestamp(),
    },
    { merge: true }
  );
}

export async function deleteUserTrack(
  uid: string,
  trackId: string
): Promise<void> {
  const ref = doc(getFirebaseDb(), "users", uid, "tracks", trackId);
  await deleteDoc(ref);
}
