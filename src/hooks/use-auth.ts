"use client";

import { useEffect, useState, useCallback } from "react";
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

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  isConfigured: boolean;
}

interface AuthActions {
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  sendEmailLink: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (displayName: string, character?: CharacterType) => Promise<void>;
  clearError: () => void;
}

export type UseAuthReturn = AuthState & AuthActions;

/**
 * Hook for Firebase authentication
 * Manages auth state, user profile, and provides auth actions
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    error: null,
    isConfigured: false,
  });

  // Check if Firebase is configured on mount
  useEffect(() => {
    const configured = isFirebaseConfigured();
    if (!configured) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        isConfigured: false,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        isConfigured: true,
      }));
    }
  }, []);

  // Handle email link sign-in on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!state.isConfigured) return;

    const url = window.location.href;
    if (isEmailSignInLink(url)) {
      completeEmailLinkSignIn(url)
        .then((user) => {
          if (user) {
            // Clear the URL parameters
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          }
        })
        .catch((error) => {
          setState((prev) => ({ ...prev, error }));
        });
    }
  }, [state.isConfigured]);

  // Subscribe to auth state changes
  useEffect(() => {
    if (!state.isConfigured) return;

    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        try {
          // Create or get user profile
          const profile = await createOrUpdateUserProfile(user);
          setState((prev) => ({
            ...prev,
            user,
            profile,
            isLoading: false,
            error: null,
          }));
        } catch (error) {
          setState((prev) => ({
            ...prev,
            user,
            profile: null,
            isLoading: false,
            error:
              error instanceof Error
                ? error
                : new Error("Failed to load profile"),
          }));
        }
      } else {
        setState((prev) => ({
          ...prev,
          user: null,
          profile: null,
          isLoading: false,
          error: null,
        }));
      }
    });

    return unsubscribe;
  }, [state.isConfigured]);

  const handleSignInWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await signInWithGoogle();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error ? error : new Error("Google sign-in failed"),
      }));
    }
  }, []);

  const handleSignInWithEmail = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        await signInWithEmail(email, password);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error : new Error("Email sign-in failed"),
        }));
      }
    },
    []
  );

  const handleSignUpWithEmail = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        await signUpWithEmail(email, password);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error("Sign-up failed"),
        }));
      }
    },
    []
  );

  const handleSendEmailLink = useCallback(async (email: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await sendEmailLink(email);
      setState((prev) => ({ ...prev, isLoading: false }));
      return true;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error
            : new Error("Failed to send email link"),
      }));
      return false;
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await firebaseSignOut();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error("Sign-out failed"),
      }));
    }
  }, []);

  const handleUpdateProfile = useCallback(
    async (displayName: string, character?: CharacterType) => {
      if (!state.user) return;

      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const profile = await createOrUpdateUserProfile(state.user, {
          displayName,
          character,
        });
        setState((prev) => ({ ...prev, profile, isLoading: false }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error
              ? error
              : new Error("Failed to update profile"),
        }));
      }
    },
    [state.user]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithEmail: handleSignInWithEmail,
    signUpWithEmail: handleSignUpWithEmail,
    sendEmailLink: handleSendEmailLink,
    signOut: handleSignOut,
    updateProfile: handleUpdateProfile,
    clearError,
  };
}
