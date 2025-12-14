"use client";

import { useState } from "react";

interface AvatarProps {
  /** Photo URL from profile or auth provider */
  photoURL?: string | null;
  /** Display name for fallback initial */
  displayName?: string | null;
  /** Email for fallback initial */
  email?: string | null;
  /** Size in pixels */
  size?: "sm" | "md" | "lg";
  /** Additional class names */
  className?: string;
}

const sizeClasses = {
  sm: "h-7 w-7 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-16 w-16 text-2xl",
};

/**
 * Avatar component that displays a user's photo or a fallback initial.
 * Handles broken image links gracefully by falling back to initials.
 */
export function Avatar({
  photoURL,
  displayName,
  email,
  size = "md",
  className = "",
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Get the initial for the fallback
  const initial =
    displayName?.charAt(0)?.toUpperCase() ||
    email?.charAt(0)?.toUpperCase() ||
    "?";

  // Show fallback if no URL or image failed to load
  if (!photoURL || imageError) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600 ${sizeClasses[size]} ${className}`}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={photoURL}
      alt={displayName || "Profile"}
      className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      onError={() => setImageError(true)}
      referrerPolicy="no-referrer"
    />
  );
}
