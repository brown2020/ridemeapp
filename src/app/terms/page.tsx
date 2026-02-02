import Link from "next/link";

export const metadata = {
  title: "Terms of Service - Ride.me",
  description: "Terms of service for Ride.me",
};

export default function TermsOfService() {
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
          Terms of Service
        </h1>

        <div className="prose prose-slate">
          <p className="text-slate-600">
            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
          </p>

          <h2 className="mt-8 text-xl font-semibold text-slate-900">
            Acceptance of Terms
          </h2>
          <p className="mt-2 text-slate-600">
            By accessing or using Ride.me, you agree to be bound by these Terms
            of Service.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-slate-900">
            Use of Service
          </h2>
          <p className="mt-2 text-slate-600">
            Ride.me is a free, open-source Line Rider clone. You may use it for
            personal entertainment. You agree not to:
          </p>
          <ul className="mt-2 list-disc pl-6 text-slate-600">
            <li>Use the service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with other users&apos; enjoyment of the service</li>
          </ul>

          <h2 className="mt-8 text-xl font-semibold text-slate-900">
            User Content
          </h2>
          <p className="mt-2 text-slate-600">
            Tracks you create are your own. By saving tracks to our service, you
            grant us permission to store and display them as part of the service
            functionality.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-slate-900">
            Disclaimer
          </h2>
          <p className="mt-2 text-slate-600">
            Ride.me is provided &quot;as is&quot; without warranties of any
            kind. We are not responsible for any data loss or service
            interruptions.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-slate-900">
            Changes to Terms
          </h2>
          <p className="mt-2 text-slate-600">
            We may update these terms from time to time. Continued use of the
            service constitutes acceptance of updated terms.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-slate-900">Contact</h2>
          <p className="mt-2 text-slate-600">
            For questions about these terms, please open an issue on our GitHub
            repository.
          </p>
        </div>
      </div>
    </main>
  );
}
