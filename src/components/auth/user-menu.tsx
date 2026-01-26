"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AuthModal } from "./auth-modal";
import { ProfileModal } from "./profile-modal";
import { Avatar } from "./avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function UserMenu() {
  const auth = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Don't show anything if Firebase is not configured
  if (!auth.isConfigured) {
    return null;
  }

  // Signed out state (or loading while modal is open)
  if (!auth.user) {
    return (
      <>
        {/* Show loading spinner OR sign in button, but NOT when modal is open */}
        {auth.isLoading && !showAuthModal ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <LoadingSpinner className="h-4 w-4" />
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            Sign In
          </button>
        )}

        {/* Always render modal when showAuthModal is true - don't unmount during loading! */}
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
        className="rounded-full transition hover:ring-2 hover:ring-slate-200"
        title={displayName || auth.user?.email || "Profile"}
        aria-label={displayName || auth.user?.email || "Open profile"}
      >
        <Avatar
          photoURL={photoURL}
          displayName={displayName}
          email={auth.user?.email}
          size="sm"
        />
      </button>

      {showProfileModal && (
        <ProfileModal auth={auth} onClose={() => setShowProfileModal(false)} />
      )}
    </>
  );
}
