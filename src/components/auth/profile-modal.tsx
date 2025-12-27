"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { createPortal } from "react-dom";
import type { UseAuthReturn } from "@/hooks/use-auth";
import { Avatar } from "./avatar";
import { CharacterSelector } from "./character-selector";
import type { CharacterType } from "@/lib/linerider/characters";
import { useLineriderStore } from "@/stores/linerider-store";
import { X } from "lucide-react";

interface ProfileModalProps {
  auth: UseAuthReturn;
  onClose: () => void;
}

export function ProfileModal({ auth, onClose }: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(
    auth.profile?.displayName || ""
  );
  const [saved, setSaved] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const character = useLineriderStore((s) => s.character);
  const setStoreCharacter = useLineriderStore((s) => s.setCharacter);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Handler to update both local state AND the game store immediately
  const handleCharacterSelect = (newCharacter: CharacterType) => {
    setStoreCharacter(newCharacter); // Update game immediately
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await auth.updateProfile(displayName, character);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Use portal to render at document body level
  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="min-h-full px-4 py-12">
        <div
          ref={modalRef}
          className="relative mx-auto w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Your Profile
          </h2>

          {/* Error message */}
          {auth.error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {auth.error.message}
              <button
                onClick={auth.clearError}
                className="ml-2 font-medium underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Success message */}
          {saved && (
            <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              ✓ Profile saved successfully!
            </div>
          )}

          {/* User info */}
          <div className="mb-6 flex items-center gap-4">
            <Avatar
              photoURL={auth.profile?.photoURL || auth.user?.photoURL}
              displayName={auth.profile?.displayName || auth.user?.displayName}
              email={auth.user?.email}
              size="lg"
            />
            <div>
              <p className="text-sm text-gray-500">Signed in as</p>
              <p className="font-medium text-gray-900">{auth.user?.email}</p>
            </div>
          </div>

          {/* Profile form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="displayName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Your name"
              />
            </div>

            {/* Character selector */}
            <CharacterSelector
              selectedCharacter={character}
              onSelect={handleCharacterSelect}
            />

            <button
              type="submit"
              disabled={auth.isLoading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              {auth.isLoading ? "Saving..." : "Save Profile"}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <button
              onClick={auth.signOut}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
