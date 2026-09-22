"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { EmailConfirmModal } from "./email-confirm-modal";
import { ProfileModal } from "./profile-modal";
import { Avatar } from "./avatar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function UserMenu() {
  const auth = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  if (!auth.isConfigured) {
    return null;
  }

  if (auth.pendingEmailLinkConfirmation) {
    return <EmailConfirmModal auth={auth} />;
  }

  if (!auth.user) {
    return (
      <div className="flex items-center gap-2">
        {auth.isLoading ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <LoadingSpinner className="h-4 w-4" />
          </div>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Create account
            </Link>
          </>
        )}
      </div>
    );
  }

  const photoURL = auth.profile?.photoURL || auth.user?.photoURL;
  const displayName = auth.profile?.displayName || auth.user?.displayName;

  return (
    <>
      <button
        type="button"
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

      {showProfileModal ? (
        <ProfileModal auth={auth} onClose={() => setShowProfileModal(false)} />
      ) : null}
    </>
  );
}
