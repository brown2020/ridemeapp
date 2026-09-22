import type { ReactNode } from "react";
import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <header className="px-4 py-6 text-center">
        <Link
          href="/"
          className="rounded text-3xl font-bold text-blue-700 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          Ride.me
        </Link>
        {subtitle ? <p className="mt-2 text-slate-600">{subtitle}</p> : null}
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-center text-2xl font-semibold text-slate-900">
            {title}
          </h1>
          {children}
        </div>
      </main>
    </div>
  );
}
