import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-white text-black">
      <div className="text-center">
        <div className="text-sm font-medium text-black/60">404</div>
        <h1 className="mt-1 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-black/70">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          &larr; Back to Ride.me
        </Link>
      </div>
    </main>
  );
}
