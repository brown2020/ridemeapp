import { sanitizePhotoUrl } from "./photo-url";

export const MAX_DISPLAY_NAME_LENGTH = 50;

export function normalizeDisplayName(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, MAX_DISPLAY_NAME_LENGTH);
  return trimmed.length > 0 ? trimmed : null;
}

type ProfileIdentityInput = Readonly<{
  displayName?: string;
  photoURL?: string;
}>;

/**
 * Provider name and photo are copied only when the profile document is created.
 * Later saves change those fields only when the caller passes them.
 */
export function profileIdentityUpdate(options: {
  isNewProfile: boolean;
  additional?: ProfileIdentityInput;
  authDisplayName: string | null;
  authPhotoURL: string | null;
}): { displayName?: string | null; photoURL?: string | null } {
  if (options.isNewProfile) {
    const displaySource =
      options.additional && "displayName" in options.additional
        ? options.additional.displayName
        : options.authDisplayName;
    const photoSource =
      options.additional && "photoURL" in options.additional
        ? options.additional.photoURL
        : options.authPhotoURL;
    return {
      displayName: normalizeDisplayName(displaySource),
      photoURL: sanitizePhotoUrl(photoSource),
    };
  }

  const fields: { displayName?: string | null; photoURL?: string | null } = {};
  if (options.additional && "displayName" in options.additional) {
    fields.displayName = normalizeDisplayName(options.additional.displayName);
  }
  if (options.additional && "photoURL" in options.additional) {
    fields.photoURL = sanitizePhotoUrl(options.additional.photoURL);
  }
  return fields;
}
