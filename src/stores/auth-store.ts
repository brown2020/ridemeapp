"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { User } from "firebase/auth";
import {
  onAuthChange,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  sendEmailLink,
  completeEmailLinkSignIn,
  isEmailSignInLink,
  signOut as firebaseSignOut,
  createOrUpdateUserProfile,
  isFirebaseConfigured,
  EmailRequiredError,
  type UserProfile,
} from "@/lib/firebase";
import type { CharacterType } from "@/lib/linerider/characters";

type AuthState = Readonly<{
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  isConfigured: boolean;
  hasInitialized: boolean;
  /** Set when email link sign-in needs email confirmation */
  pendingEmailLinkUrl: string | null;
}>;

type AuthActions = Readonly<{
  init: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  sendEmailLink: (email: string) => Promise<boolean>;
  /** Complete pending email link sign-in with provided email */
  confirmEmailLinkSignIn: (email: string) => Promise<void>;
  /** Cancel pending email link sign-in */
  cancelEmailLinkSignIn: () => void;
  signOut: () => Promise<void>;
  updateProfile: (
    displayName: string,
    character?: CharacterType
  ) => Promise<void>;
  clearError: () => void;
}>;

export type AuthStore = AuthState & AuthActions;

/**
 * Known Firebase Auth error codes mapped to user-friendly messages.
 * These are expected user-facing outcomes, not application errors.
 */
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
  "auth/expired-action-code": "This sign-in link has expired. Please request a new one.",
  "auth/invalid-action-code": "This sign-in link is invalid or has already been used.",
};

function asError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) {
    // Check for Firebase Auth error codes and return a friendly message
    const code = (error as { code?: string }).code;
    if (code && code in AUTH_ERROR_MESSAGES) {
      return new Error(AUTH_ERROR_MESSAGES[code]);
    }
    return error;
  }
  if (typeof error === "string") return new Error(error);
  return new Error(fallbackMessage);
}

let authUnsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set, get) => ({
    user: null,
    profile: null,
    isLoading: true,
    error: null,
    isConfigured: false,
    hasInitialized: false,
    pendingEmailLinkUrl: null,

    init: () => {
      // Check and set hasInitialized atomically to prevent race conditions
      if (get().hasInitialized) return;
      set({ hasInitialized: true });

      const configured = isFirebaseConfigured();
      if (!configured) {
        if (authUnsubscribe) {
          authUnsubscribe();
          authUnsubscribe = null;
        }
        set({
          isConfigured: false,
          isLoading: false,
          user: null,
          profile: null,
          error: null,
        });
        return;
      }

      set({ isConfigured: true });

      // Handle email link sign-in (passwordless) once on init
      if (typeof window !== "undefined") {
        const url = window.location.href;
        if (isEmailSignInLink(url)) {
          // Keep loading; auth listener will reconcile user state.
          completeEmailLinkSignIn(url)
            .then((user) => {
              if (user) {
                window.history.replaceState(
                  {},
                  document.title,
                  window.location.pathname
                );
              }
            })
            .catch((error) => {
              if (error instanceof EmailRequiredError) {
                // Email not in localStorage - prompt user via modal
                set({
                  pendingEmailLinkUrl: url,
                  isLoading: false,
                });
              } else {
                set({
                  error: asError(error, "Failed to complete email sign-in"),
                  isLoading: false,
                });
              }
            });
        }
      }

      // Subscribe once to auth changes
      if (authUnsubscribe) {
        authUnsubscribe();
        authUnsubscribe = null;
      }

      authUnsubscribe = onAuthChange(async (user) => {
        if (!user) {
          set({
            user: null,
            profile: null,
            isLoading: false,
            error: null,
          });
          return;
        }

        try {
          const profile = await createOrUpdateUserProfile(user);
          set({ user, profile, isLoading: false, error: null });
        } catch (error) {
          set({
            user,
            profile: null,
            isLoading: false,
            error: asError(error, "Failed to load profile"),
          });
        }
      });
    },

    signInWithGoogle: async () => {
      get().init();
      if (!get().isConfigured) {
        set({
          isLoading: false,
          error: new Error("Firebase is not configured"),
        });
        return;
      }

      set({ isLoading: true, error: null });
      try {
        await signInWithGoogle();
        // Do not stop loading here; auth listener will set state.
      } catch (error) {
        set({
          isLoading: false,
          error: asError(error, "Google sign-in failed"),
        });
      }
    },

    signInWithEmail: async (email: string, password: string) => {
      get().init();
      if (!get().isConfigured) {
        set({
          isLoading: false,
          error: new Error("Firebase is not configured"),
        });
        return;
      }

      set({ isLoading: true, error: null });
      try {
        await signInWithEmail(email, password);
      } catch (error) {
        set({
          isLoading: false,
          error: asError(error, "Email sign-in failed"),
        });
      }
    },

    signUpWithEmail: async (email: string, password: string) => {
      get().init();
      if (!get().isConfigured) {
        set({
          isLoading: false,
          error: new Error("Firebase is not configured"),
        });
        return;
      }

      set({ isLoading: true, error: null });
      try {
        await signUpWithEmail(email, password);
      } catch (error) {
        set({ isLoading: false, error: asError(error, "Sign-up failed") });
      }
    },

    sendEmailLink: async (email: string): Promise<boolean> => {
      get().init();
      if (!get().isConfigured) {
        set({
          isLoading: false,
          error: new Error("Firebase is not configured"),
        });
        return false;
      }

      set({ isLoading: true, error: null });
      try {
        await sendEmailLink(email);
        set({ isLoading: false });
        return true;
      } catch (error) {
        set({
          isLoading: false,
          error: asError(error, "Failed to send email link"),
        });
        return false;
      }
    },

    confirmEmailLinkSignIn: async (email: string) => {
      const url = get().pendingEmailLinkUrl;
      if (!url) return;

      set({ isLoading: true, error: null });
      try {
        const user = await completeEmailLinkSignIn(url, email);
        if (user) {
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }
        set({ pendingEmailLinkUrl: null });
        // Auth listener will handle the rest
      } catch (error) {
        set({
          isLoading: false,
          error: asError(error, "Failed to complete email sign-in"),
        });
      }
    },

    cancelEmailLinkSignIn: () => {
      // Clear the pending URL and remove from address bar
      window.history.replaceState({}, document.title, window.location.pathname);
      set({ pendingEmailLinkUrl: null });
    },

    signOut: async () => {
      get().init();
      if (!get().isConfigured) {
        set({
          isLoading: false,
          error: new Error("Firebase is not configured"),
        });
        return;
      }

      set({ isLoading: true, error: null });
      try {
        await firebaseSignOut();
        // Do not stop loading here; auth listener will set state.
      } catch (error) {
        set({ isLoading: false, error: asError(error, "Sign-out failed") });
      }
    },

    updateProfile: async (displayName: string, character?: CharacterType) => {
      get().init();
      if (!get().isConfigured) {
        set({
          isLoading: false,
          error: new Error("Firebase is not configured"),
        });
        return;
      }

      const user = get().user;
      if (!user) return;

      set({ isLoading: true, error: null });
      try {
        const profile = await createOrUpdateUserProfile(user, {
          displayName,
          character,
        });
        set({ profile, isLoading: false });
      } catch (error) {
        set({
          isLoading: false,
          error: asError(error, "Failed to update profile"),
        });
      }
    },

    clearError: () => set({ error: null }),
  }))
);
