"use client";

import { useId, useState, useEffect, useRef, type FormEvent } from "react";
import { createPortal } from "react-dom";
import type { UseAuthReturn } from "@/hooks/use-auth";
import { X } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useModalA11y } from "@/hooks/use-modal-a11y";

type AuthMode = "signin" | "signup" | "email-link";

interface AuthModalProps {
  auth: UseAuthReturn;
  onClose: () => void;
}

export function AuthModal({ auth, onClose }: AuthModalProps) {
  const titleId = useId();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Stable reference to onClose to avoid effect churn
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Close modal if sign-in was successful (avoid side-effects during render)
  useEffect(() => {
    if (auth.user && !auth.isLoading) {
      onCloseRef.current();
    }
  }, [auth.user, auth.isLoading]);

  // Modal accessibility (Escape key, focus trap, focus restoration)
  useModalA11y({ containerRef: modalRef, onClose, isOpen: true });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (mode === "signin") {
      await auth.signInWithEmail(email, password);
    } else if (mode === "signup") {
      await auth.signUpWithEmail(email, password);
    } else if (mode === "email-link") {
      const emailToSend = email;
      const success = await auth.sendEmailLink(emailToSend);
      if (success) {
        setSentToEmail(emailToSend);
        setEmailLinkSent(true);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    await auth.signInWithGoogle();
  };

  const handleResendEmail = async () => {
    if (sentToEmail) {
      await auth.sendEmailLink(sentToEmail);
    }
  };

  const handleTryDifferentEmail = () => {
    setEmailLinkSent(false);
    setSentToEmail("");
    setEmail("");
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCloseRef.current();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-modal overflow-y-auto bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div className="min-h-full px-4 py-12">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="relative mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={() => onCloseRef.current()}
            className="absolute right-4 top-4 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Email Link Sent - Waiting State */}
          {emailLinkSent && mode === "email-link" ? (
            <div className="text-center">
              {/* Email icon */}
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

              <h2 id={titleId} className="mb-2 text-2xl font-bold text-gray-900">
                Check your email
              </h2>

              <p className="mb-2 text-gray-600">We sent a sign-in link to:</p>
              <p className="mb-6 font-medium text-gray-900">{sentToEmail}</p>

              <div className="mb-6 rounded-lg bg-amber-50 p-4 text-left text-sm text-amber-800">
                <p className="mb-2 font-medium">Don&apos;t see it?</p>
                <ul className="list-inside list-disc space-y-1 text-amber-700">
                  <li>Check your spam or junk folder</li>
                  <li>Make sure you entered the correct email</li>
                  <li>The link expires in 1 hour</li>
                </ul>
              </div>

              {/* Error message */}
              {auth.error && (
                <div
                  className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                  role="alert"
                  aria-live="polite"
                >
                  {auth.error.message}
                  <button
                    onClick={auth.clearError}
                    className="ml-2 font-medium underline hover:no-underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleResendEmail}
                  disabled={auth.isLoading}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                >
                  {auth.isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner className="h-4 w-4" />
                      Sending...
                    </span>
                  ) : (
                    "Resend email"
                  )}
                </button>

                <button
                  onClick={handleTryDifferentEmail}
                  className="w-full text-sm font-medium text-blue-600 hover:underline"
                >
                  Try a different email
                </button>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setMode("signin");
                      setEmailLinkSent(false);
                      setSentToEmail("");
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Back to sign in
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <h2 id={titleId} className="mb-6 text-2xl font-bold text-gray-900">
                {mode === "signin" && "Sign In"}
                {mode === "signup" && "Create Account"}
                {mode === "email-link" && "Sign In with Email Link"}
              </h2>

              {/* Error message */}
              {auth.error && (
                <div
                  className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                  role="alert"
                  aria-live="polite"
                >
                  {auth.error.message}
                  <button
                    onClick={auth.clearError}
                    className="ml-2 font-medium underline hover:no-underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={auth.isLoading}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-sm text-gray-500">or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Email form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="you@example.com"
                  />
                </div>

                {mode !== "email-link" && (
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={auth.isLoading}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {auth.isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner className="h-4 w-4" />
                      Loading...
                    </span>
                  ) : mode === "signin" ? (
                    "Sign In"
                  ) : mode === "signup" ? (
                    "Create Account"
                  ) : (
                    "Send Sign-In Link"
                  )}
                </button>
              </form>

              {/* Mode switcher */}
              <div className="mt-6 space-y-2 text-center text-sm text-gray-600">
                {mode === "signin" && (
                  <>
                    <p>
                      Don&apos;t have an account?{" "}
                      <button
                        onClick={() => setMode("signup")}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Sign up
                      </button>
                    </p>
                    <p>
                      <button
                        onClick={() => setMode("email-link")}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        Sign in with email link instead
                      </button>
                    </p>
                  </>
                )}
                {mode === "signup" && (
                  <p>
                    Already have an account?{" "}
                    <button
                      onClick={() => setMode("signin")}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Sign in
                    </button>
                  </p>
                )}
                {mode === "email-link" && (
                  <p>
                    <button
                      onClick={() => {
                        setMode("signin");
                        setEmailLinkSent(false);
                      }}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Back to sign in with password
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
