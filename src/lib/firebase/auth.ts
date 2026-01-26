import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type ActionCodeSettings,
} from "firebase/auth";
import {
  getFirebaseAuth,
  getEmailLinkRedirectUrl,
  isFirebaseConfigured,
} from "./config";

/**
 * Google Auth Provider instance
 */
const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google popup
 */
export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<User> {
  const auth = getFirebaseAuth();
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * Create a new account with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<User> {
  const auth = getFirebaseAuth();
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

/**
 * Send a sign-in link to the user's email (passwordless)
 */
export async function sendEmailLink(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  const actionCodeSettings: ActionCodeSettings = {
    url: getEmailLinkRedirectUrl(),
    handleCodeInApp: true,
  };

  await sendSignInLinkToEmail(auth, email, actionCodeSettings);

  // Save the email locally to complete sign-in when user clicks the link
  if (typeof window !== "undefined") {
    window.localStorage.setItem("emailForSignIn", email);
  }
}

/**
 * Complete sign-in with email link (call this when the page loads)
 */
export async function completeEmailLinkSignIn(
  url: string
): Promise<User | null> {
  if (typeof window === "undefined") {
    throw new Error("Email link sign-in can only be completed client-side");
  }

  const auth = getFirebaseAuth();

  if (!isSignInWithEmailLink(auth, url)) {
    return null;
  }

  // Get the email from localStorage
  let email = window.localStorage.getItem("emailForSignIn");

  if (!email) {
    // If missing, prompt the user for their email
    email = window.prompt("Please provide your email for confirmation");
  }

  if (!email) {
    throw new Error("Email is required to complete sign-in");
  }

  const result = await signInWithEmailLink(auth, email, url);

  // Clear the email from storage
  window.localStorage.removeItem("emailForSignIn");

  return result.user;
}

/**
 * Check if the current URL is a sign-in link
 */
export function isEmailSignInLink(url: string): boolean {
  if (!isFirebaseConfigured()) return false;
  const auth = getFirebaseAuth();
  return isSignInWithEmailLink(auth, url);
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(
  callback: (user: User | null) => void
): () => void {
  if (!isFirebaseConfigured()) {
    // If Firebase is not configured, immediately call with null and return no-op
    callback(null);
    return () => {};
  }

  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}

/**
 * Get the current user (may be null if not signed in)
 */
export function getCurrentUser(): User | null {
  if (!isFirebaseConfigured()) return null;
  const auth = getFirebaseAuth();
  return auth.currentUser;
}
