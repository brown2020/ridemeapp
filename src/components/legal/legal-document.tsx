import Link from "next/link";
import type { ReactNode } from "react";

export function LegalDocument({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-white px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-slate-500 hover:text-slate-700"
        >
          &larr; Back to Ride.me
        </Link>

        <h1 className="mb-8 text-3xl font-bold text-slate-900">{title}</h1>

        <div className="prose prose-slate">{children}</div>
      </div>
    </main>
  );
}
