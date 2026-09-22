"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordReset, getAuthErrorMessage } from "@/lib/firebase/auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setEmailSent(true);
    } catch (error) {
      setLocalError(getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-4">
        <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h3 className="mb-1 font-medium text-green-900">Check your email</h3>
          <p className="text-sm text-green-900">
            We sent a password reset link to <strong>{email}</strong>. Click the
            link in the email to choose a new password.
          </p>
        </div>
        <p className="text-center text-sm text-slate-600">
          Didn&apos;t receive the email?{" "}
          <button
            type="button"
            onClick={() => setEmailSent(false)}
            className="font-medium text-blue-700 hover:underline"
          >
            Try again
          </button>
        </p>
        <p className="text-center text-sm text-slate-600">
          <Link href="/login" className="font-medium text-blue-700 hover:underline">
            Back to Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
      {localError ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {localError}
        </div>
      ) : null}

      <div>
        <label htmlFor="forgot-password-email" className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="forgot-password-email"
          type="email"
          name="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          placeholder="you@example.com"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? <LoadingSpinner className="h-4 w-4" /> : null}
        Send reset link
      </button>

      <p className="text-center text-sm text-slate-600">
        <Link href="/login" className="font-medium text-blue-700 hover:underline">
          Back to Sign in
        </Link>
      </p>
    </form>
  );
}
