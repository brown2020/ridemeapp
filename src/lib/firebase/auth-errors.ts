const GENERIC_AUTH_ERROR = "Something went wrong. Please try again.";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Invalid email or password. Please try again.",
  "auth/user-not-found": "Invalid email or password. Please try again.",
  "auth/wrong-password": "Invalid email or password. Please try again.",
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

function authErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
}

/** Map Firebase Auth errors to user-facing copy. Unknown errors stay generic. */
export function getAuthErrorMessage(
  error: unknown,
  fallback: string = GENERIC_AUTH_ERROR
): string {
  const code = authErrorCode(error);
  if (code && code in AUTH_ERROR_MESSAGES) {
    return AUTH_ERROR_MESSAGES[code];
  }
  return fallback;
}

/** Password reset treats a missing account like success so responses do not reveal it. */
export function isSilentPasswordResetError(error: unknown): boolean {
  return authErrorCode(error) === "auth/user-not-found";
}
