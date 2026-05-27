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
  createOrUpdateUserProfile,
  type UserProfile,
  type UserProfileData,
} from "./users";

export {
  listUserTracks,
  getUserTrack,
  createUserTrack,
  updateUserTrack,
  deleteUserTrack,
  countUserTracks,
  cloudTrackToTrackFile,
  parseCloudTrackDocument,
  MAX_USER_TRACKS,
  type CloudTrackSummary,
  type CloudTrackDocument,
} from "./tracks";
