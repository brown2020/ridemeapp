const MAX_PHOTO_URL_LENGTH = 2048;

const PHOTO_HOSTS = new Set([
  "lh3.googleusercontent.com",
  "lh4.googleusercontent.com",
  "lh5.googleusercontent.com",
  "lh6.googleusercontent.com",
  "firebasestorage.googleapis.com",
  "graph.facebook.com",
]);

const PHOTO_HOST_SUFFIXES = [".googleusercontent.com"] as const;

export function isSafePhotoUrl(value: string | null | undefined): value is string {
  if (!value || value.length > MAX_PHOTO_URL_LENGTH) return false;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== "https:") return false;
  if (url.username || url.password) return false;

  const host = url.hostname.toLowerCase();
  if (PHOTO_HOSTS.has(host)) return true;
  return PHOTO_HOST_SUFFIXES.some(
    (suffix) => host.endsWith(suffix) && host.length > suffix.length
  );
}

export function sanitizePhotoUrl(value: string | null | undefined): string | null {
  return isSafePhotoUrl(value) ? value : null;
}
