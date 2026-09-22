import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/signup-form";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export const metadata: Metadata = {
  title: "Create Account · Ride.me",
  description: "Create a Ride.me account to save cloud tracks.",
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create account"
      subtitle="Start saving your Line Rider tracks to the cloud"
    >
      <div className="space-y-6">
        <GoogleSignInButton redirectTo="/" />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-slate-600">or continue with email</span>
          </div>
        </div>
        <SignUpForm redirectTo="/" />
      </div>
    </AuthShell>
  );
}
