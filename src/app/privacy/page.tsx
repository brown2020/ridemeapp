import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - Ride.me",
  description: "Privacy policy for Ride.me",
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-dvh bg-white px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-slate-500 hover:text-slate-700"
        >
          &larr; Back to Ride.me
        </Link>

        <h1 className="mb-8 text-3xl font-bold text-slate-900">
          Privacy Policy
        </h1>

        <div className="prose prose-slate">
          <p className="text-slate-600">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <h2 className="mt-8 text-xl font-semibold text-slate-900">
            Information We Collect
          </h2>
          <p className="mt-2 text-slate-600">
            When you create an account, we collect your email address and
            display name. If you sign in with Google, we may also receive your
            profile picture.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-slate-900">
            How We Use Your Information
          </h2>
          <p className="mt-2 text-slate-600">
            We use your information to provide and improve Ride.me, including:
          </p>
          <ul className="mt-2 list-disc pl-6 text-slate-600">
            <li>Authenticating your account</li>
            <li>Saving your preferences and tracks</li>
            <li>Displaying your profile to other users (if applicable)</li>
          </ul>

          <h2 className="mt-8 text-xl font-semibold text-slate-900">
            Data Storage
          </h2>
          <p className="mt-2 text-slate-600">
            Your data is stored securely using Firebase services provided by
            Google. We do not sell or share your personal information with third
            parties.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-slate-900">Cookies</h2>
          <p className="mt-2 text-slate-600">
            We use essential cookies for authentication. No tracking or
            advertising cookies are used.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-slate-900">
            Your Rights
          </h2>
          <p className="mt-2 text-slate-600">
            You can delete your account and all associated data at any time by
            contacting us.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-slate-900">Contact</h2>
          <p className="mt-2 text-slate-600">
            For questions about this privacy policy, please open an issue on our
            GitHub repository.
          </p>
        </div>
      </div>
    </main>
  );
}
