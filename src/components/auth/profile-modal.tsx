"use client";

import { useState, useEffect, type FormEvent } from "react";
import type { UseAuthReturn } from "@/hooks/use-auth";
import { Avatar } from "./avatar";
import { CharacterSelector } from "./character-selector";
import type { CharacterType } from "@/lib/linerider/characters";
import { useLineriderStore } from "@/stores/linerider-store";

interface ProfileModalProps {
  auth: UseAuthReturn;
  onClose: () => void;
}

export function ProfileModal({ auth, onClose }: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(
    auth.profile?.displayName || ""
  );
  const [character, setCharacter] = useState<CharacterType>(
    auth.profile?.character || "ball"
  );
  const [saved, setSaved] = useState(false);
  
  // Get the store's setCharacter to update game in real-time
  const setStoreCharacter = useLineriderStore((s) => s.setCharacter);

  // Sync character from profile when it changes (e.g., on initial load)
  useEffect(() => {
    if (auth.profile?.character) {
      setCharacter(auth.profile.character);
    }
  }, [auth.profile?.character]);

  // Handler to update both local state AND the game store immediately
  const handleCharacterSelect = (newCharacter: CharacterType) => {
    setCharacter(newCharacter);
    setStoreCharacter(newCharacter); // Update game immediately
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await auth.updateProfile(displayName, character);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="mb-6 text-2xl font-bold text-gray-900">Your Profile</h2>

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
  );
}
