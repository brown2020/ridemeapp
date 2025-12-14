"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "@/stores/auth-store";

interface AuthState {
  user: ReturnType<typeof useAuthStore.getState>["user"];
  profile: ReturnType<typeof useAuthStore.getState>["profile"];
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
  updateProfile: (
    displayName: string,
    character?: Parameters<
      ReturnType<typeof useAuthStore.getState>["updateProfile"]
    >[1]
  ) => Promise<void>;
  clearError: () => void;
}

export type UseAuthReturn = AuthState & AuthActions;

/**
 * Hook for Firebase authentication
 * Backed by a single Zustand store so Firebase subscriptions are shared.
 */
export function useAuth(): UseAuthReturn {
  useEffect(() => {
    useAuthStore.getState().init();
  }, []);

  return useAuthStore(
    useShallow((s) => ({
      user: s.user,
      profile: s.profile,
      isLoading: s.isLoading,
      error: s.error,
      isConfigured: s.isConfigured,
      signInWithGoogle: s.signInWithGoogle,
      signInWithEmail: s.signInWithEmail,
      signUpWithEmail: s.signUpWithEmail,
      sendEmailLink: s.sendEmailLink,
      signOut: s.signOut,
      updateProfile: s.updateProfile,
      clearError: s.clearError,
    }))
  );
}
