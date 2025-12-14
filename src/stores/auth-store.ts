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
}>;

type AuthActions = Readonly<{
  init: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  sendEmailLink: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (
    displayName: string,
    character?: CharacterType
  ) => Promise<void>;
  clearError: () => void;
}>;

export type AuthStore = AuthState & AuthActions;

function asError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  return new Error(fallbackMessage);
}

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set, get) => ({
    user: null,
    profile: null,
    isLoading: true,
    error: null,
    isConfigured: false,
    hasInitialized: false,

    init: () => {
      const s = get();
      if (s.hasInitialized) return;

      const configured = isFirebaseConfigured();
      if (!configured) {
        set({
          hasInitialized: true,
          isConfigured: false,
          isLoading: false,
          user: null,
          profile: null,
          error: null,
        });
        return;
      }

      set({ hasInitialized: true, isConfigured: true });

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
              set({
                error: asError(error, "Failed to complete email sign-in"),
              });
            });
        }
      }

      // Subscribe once to auth changes
      const unsubscribe = onAuthChange(async (user) => {
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

      // Keep unsubscribe around without putting it in state (no need to expose)
      // This avoids accidental re-subscribes; we never re-init anyway.
      void unsubscribe;
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
