"use client";

import { useState } from "react";
import { signInWithGoogle, getAuthErrorMessage } from "@/lib/firebase/auth";
import { waitForSignedInUser } from "@/lib/auth/wait-for-session";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function GoogleSignInButton({ redirectTo = "/" }: { redirectTo?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      await waitForSignedInUser();
      window.location.assign(redirectTo);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {error ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
      >
        {loading ? <LoadingSpinner className="h-4 w-4" /> : null}
        Continue with Google
      </button>
    </div>
  );
}
