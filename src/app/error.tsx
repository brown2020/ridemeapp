"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-dvh place-items-center bg-white text-black">
      <div className="text-center px-4">
        <div className="text-sm font-medium text-black/60">
          Something went wrong
        </div>
        <h1 className="mt-1 text-2xl font-semibold">Unexpected Error</h1>
        <p className="mt-2 max-w-md text-sm text-black/70">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
