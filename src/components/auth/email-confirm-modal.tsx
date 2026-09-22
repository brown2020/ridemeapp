"use client";

import { useState, type FormEvent } from "react";
import type { UseAuthReturn } from "@/hooks/use-auth";
import { X } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ModalDialog } from "@/components/ui/modal-dialog";

interface EmailConfirmModalProps {
  auth: UseAuthReturn;
}

export function EmailConfirmModal({ auth }: EmailConfirmModalProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await auth.confirmEmailLinkSignIn(email.trim());
  };

  return (
    <ModalDialog open title="Confirm Your Email" onClose={auth.cancelEmailLinkSignIn}>
      <button
        type="button"
        onClick={auth.cancelEmailLinkSignIn}
        className="absolute right-4 top-4 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
        <svg
          className="h-8 w-8 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>

      <h2 className="mb-2 text-center text-2xl font-bold text-slate-900">
        Confirm Your Email
      </h2>

      <p className="mb-6 text-center text-slate-600">
        Please enter the email address you used to request the sign-in link.
      </p>

      {auth.error ? (
        <div
          className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          {auth.error.message}
          <button
            type="button"
            onClick={auth.clearError}
            className="ml-2 font-medium underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label
            htmlFor="confirm-email"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Email Address
          </label>
          <input
            id="confirm-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={auth.isLoading || !email.trim()}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          {auth.isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner className="h-4 w-4" />
              Signing in...
            </span>
          ) : (
            "Continue"
          )}
        </button>
      </form>

      <button
        type="button"
        onClick={auth.cancelEmailLinkSignIn}
        className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-700"
      >
        Cancel
      </button>
    </ModalDialog>
  );
}
