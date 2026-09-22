import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password · Ride.me",
  description: "Reset your Ride.me account password.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset password"
      subtitle="We'll email you a link to choose a new password"
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
