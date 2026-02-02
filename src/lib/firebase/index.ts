// Firebase configuration and instances
export {
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseDb,
  isFirebaseConfigured,
  getEmailLinkRedirectUrl,
} from "./config";

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
  getCurrentUser,
  EmailRequiredError,
} from "./auth";

// User profile functions
export {
  getUserProfile,
  createOrUpdateUserProfile,
  updateUserProfile,
  type UserProfile,
  type UserProfileData,
} from "./users";
