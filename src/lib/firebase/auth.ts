import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
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
 * Error thrown when email is required to complete sign-in link flow
 */
export class EmailRequiredError extends Error {
  constructor() {
    super("Email is required to complete sign-in");
    this.name = "EmailRequiredError";
  }
}

/**
 * Complete sign-in with email link (call this when the page loads)
 * If email is not in localStorage, throws EmailRequiredError
 */
export async function completeEmailLinkSignIn(
  url: string,
  providedEmail?: string
): Promise<User | null> {
  if (typeof window === "undefined") {
    throw new Error("Email link sign-in can only be completed client-side");
  }

  const auth = getFirebaseAuth();

  if (!isSignInWithEmailLink(auth, url)) {
    return null;
  }

  // Get the email from localStorage or use provided email
  const email = providedEmail || window.localStorage.getItem("emailForSignIn");

  if (!email) {
    // Throw specific error so caller can show a proper modal
    throw new EmailRequiredError();
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
 * Send a password reset email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSendPasswordResetEmail(auth, email);
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Invalid email or password. Please try again.",
  "auth/user-not-found": "No account found with this email address.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/too-many-requests":
    "Too many attempts. Please wait a moment and try again.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/network-request-failed":
    "Network error. Please check your connection.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/expired-action-code":
    "This sign-in link has expired. Please request a new one.",
  "auth/invalid-action-code":
    "This sign-in link is invalid or has already been used.",
  "auth/missing-email": "Please enter your email address.",
};

/**
 * Map Firebase Auth errors to user-friendly copy (no raw auth/* overlays).
 */
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { code?: string }).code;
    if (code && code in AUTH_ERROR_MESSAGES) {
      return AUTH_ERROR_MESSAGES[code];
    }
    return error.message || "Something went wrong. Please try again.";
  }
  if (typeof error === "string") return error;
  return "Something went wrong. Please try again.";
}
