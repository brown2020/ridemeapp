export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-white text-black">
      <div className="text-center">
        <div className="text-sm font-medium text-black/60">404</div>
        <h1 className="mt-1 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-black/70">
          The page you’re looking for doesn’t exist.
        </p>
      </div>
    </main>
  );
}
