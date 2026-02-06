import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  type Timestamp,
  type FieldValue,
} from "firebase/firestore";
import { getFirebaseDb } from "./config";
import type { User } from "firebase/auth";
import { CHARACTER_TYPES, type CharacterType } from "@/lib/linerider/characters";

/**
 * User profile stored in Firestore
 */
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  character: CharacterType;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

/**
 * Data for creating/updating a user profile
 */
export interface UserProfileData {
  displayName?: string;
  photoURL?: string;
  character?: CharacterType;
}

/**
 * Validate that raw Firestore data matches UserProfile schema
 */
function isValidUserProfileData(data: unknown): data is UserProfile {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.uid === "string" &&
    (d.email === null || typeof d.email === "string") &&
    (d.displayName === null || typeof d.displayName === "string") &&
    (d.photoURL === null || typeof d.photoURL === "string") &&
    (d.character === undefined ||
      CHARACTER_TYPES.includes(d.character as CharacterType))
  );
}

/**
 * Normalize and validate a user profile from Firestore data
 */
function normalizeUserProfile(data: unknown): UserProfile {
  if (!isValidUserProfileData(data)) {
    throw new Error("Invalid user profile data from Firestore");
  }
  return {
    ...data,
    character: data.character || "ball",
  };
}

/**
 * Collection name for user profiles
 */
const USERS_COLLECTION = "users";

/**
 * Get a user profile by UID
 */
export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const db = getFirebaseDb();
  const docRef = doc(db, USERS_COLLECTION, uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return normalizeUserProfile(docSnap.data());
}

/**
 * Create or update a user profile from Firebase Auth user.
 * Uses setDoc with merge to avoid race conditions between concurrent
 * onAuthStateChanged callbacks (no read-then-write needed).
 */
export async function createOrUpdateUserProfile(
  user: User,
  additionalData?: UserProfileData
): Promise<UserProfile> {
  const db = getFirebaseDb();
  const docRef = doc(db, USERS_COLLECTION, user.uid);

  const profileData: Record<string, unknown> = {
    uid: user.uid,
    email: user.email,
    updatedAt: serverTimestamp(),
  };

  // Set displayName/photoURL from additional data or fall back to auth provider
  if (additionalData?.displayName) {
    profileData.displayName = additionalData.displayName;
  } else if (user.displayName) {
    profileData.displayName = user.displayName;
  }

  if (additionalData?.photoURL) {
    profileData.photoURL = additionalData.photoURL;
  } else if (user.photoURL) {
    profileData.photoURL = user.photoURL;
  }

  if (additionalData?.character) {
    profileData.character = additionalData.character;
  }

  // merge: true creates the doc if missing, or merges fields if it exists.
  // This eliminates the read-then-write race condition.
  await setDoc(docRef, profileData, { merge: true });

  // Read back to get the complete profile (including createdAt, character defaults)
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error("Failed to load profile after save");
  }

  const data = docSnap.data();

  // Ensure required fields exist for brand-new profiles
  const needsDefaults =
    !data.character || !data.createdAt || data.displayName === undefined;

  if (needsDefaults) {
    const defaults: Record<string, string | FieldValue | null> = {};
    if (!data.character) defaults.character = "ball";
    if (!data.createdAt) defaults.createdAt = serverTimestamp();
    if (data.displayName === undefined) defaults.displayName = null;
    if (data.photoURL === undefined) defaults.photoURL = null;

    await setDoc(docRef, defaults, { merge: true });

    // Return constructed profile to avoid yet another read
    return {
      uid: user.uid,
      email: user.email,
      displayName:
        (data.displayName as string | null) ??
        (defaults.displayName as string | null) ??
        null,
      photoURL:
        (data.photoURL as string | null) ??
        (defaults.photoURL as string | null) ??
        null,
      character: ((data.character as CharacterType) ||
        "ball") as CharacterType,
      createdAt: (data.createdAt as Timestamp) ?? null,
      updatedAt: (data.updatedAt as Timestamp) ?? null,
    };
  }

  return normalizeUserProfile(data);
}
