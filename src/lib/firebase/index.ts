// Firebase configuration and instances
export { isFirebaseConfigured } from "./config";

// Authentication functions
export {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  sendEmailLink,
  completeEmailLinkSignIn,
  isEmailSignInLink,
  signOut,
  onAuthChange,
  EmailRequiredError,
} from "./auth";

// User profile functions
export {
  getUserProfile,
  createOrUpdateUserProfile,
  type UserProfile,
  type UserProfileData,
} from "./users";
