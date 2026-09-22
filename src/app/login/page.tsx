import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export const metadata: Metadata = {
  title: "Sign In · Ride.me",
  description: "Sign in to Ride.me to save and open cloud tracks.",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      subtitle="Save tracks to the cloud and open them anywhere"
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
        <LoginForm redirectTo="/" />
      </div>
    </AuthShell>
  );
}
