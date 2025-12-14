import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "./config";
import type { User } from "firebase/auth";
import type { CharacterType } from "@/lib/linerider/characters";

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
 * Collection name for user profiles
 */
const USERS_COLLECTION = "users";

/**
 * Get a user profile by UID
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getFirebaseDb();
  const docRef = doc(db, USERS_COLLECTION, uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as UserProfile;
}

/**
 * Create or update a user profile from Firebase Auth user
 * Called after successful authentication
 */
export async function createOrUpdateUserProfile(
  user: User,
  additionalData?: UserProfileData
): Promise<UserProfile> {
  const db = getFirebaseDb();
  const docRef = doc(db, USERS_COLLECTION, user.uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    // Create new profile
    const newProfile: Omit<UserProfile, "createdAt" | "updatedAt"> & {
      createdAt: ReturnType<typeof serverTimestamp>;
      updatedAt: ReturnType<typeof serverTimestamp>;
    } = {
      uid: user.uid,
      email: user.email,
      displayName: additionalData?.displayName || user.displayName,
      photoURL: additionalData?.photoURL || user.photoURL,
      character: additionalData?.character || "ball",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, newProfile);

    return {
      ...newProfile,
      createdAt: null,
      updatedAt: null,
    } as UserProfile;
  }

  // Get existing data
  const existingData = docSnap.data();
  
  // Update existing profile with any new data from auth
  const updates: Record<string, unknown> = {
    email: user.email,
    updatedAt: serverTimestamp(),
  };

  // Only update displayName/photoURL if provided
  if (additionalData?.displayName) {
    updates.displayName = additionalData.displayName;
  }
  if (additionalData?.photoURL) {
    updates.photoURL = additionalData.photoURL;
  }
  if (additionalData?.character) {
    updates.character = additionalData.character;
  }
  
  // Ensure character field exists (for profiles created before this feature)
  if (!existingData.character) {
    updates.character = "ball";
  }

  await updateDoc(docRef, updates);

  const updatedSnap = await getDoc(docRef);
  const profile = updatedSnap.data() as UserProfile;
  
  // Ensure character is set in returned profile
  return {
    ...profile,
    character: profile.character || "ball",
  };
}

/**
 * Update user profile data
 */
export async function updateUserProfile(
  uid: string,
  data: UserProfileData
): Promise<void> {
  const db = getFirebaseDb();
  const docRef = doc(db, USERS_COLLECTION, uid);

  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
