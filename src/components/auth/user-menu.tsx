"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "./auth-modal";
import { ProfileModal } from "./profile-modal";
import { Avatar } from "./avatar";

export function UserMenu() {
  const auth = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Don't show anything if Firebase is not configured
  if (!auth.isConfigured) {
    return null;
  }

  // Loading state
  if (auth.isLoading) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
        <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  // Signed out state
  if (!auth.user) {
    return (
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          Sign In
        </button>

        {showAuthModal && (
          <AuthModal auth={auth} onClose={() => setShowAuthModal(false)} />
        )}
      </>
    );
  }

  // Signed in state
  // Use photoURL from profile first, then from auth user (Google), then fallback
  const photoURL = auth.profile?.photoURL || auth.user?.photoURL;
  const displayName = auth.profile?.displayName || auth.user?.displayName;

  return (
    <>
      <button
        onClick={() => setShowProfileModal(true)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1 shadow-sm transition hover:bg-gray-50"
      >
        <Avatar
          photoURL={photoURL}
          displayName={displayName}
          email={auth.user?.email}
          size="sm"
        />
        <span className="max-w-[120px] truncate text-sm font-medium text-gray-700">
          {displayName || auth.user?.email?.split("@")[0]}
        </span>
      </button>

      {showProfileModal && (
        <ProfileModal auth={auth} onClose={() => setShowProfileModal(false)} />
      )}
    </>
  );
}
