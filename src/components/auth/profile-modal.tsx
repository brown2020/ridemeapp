"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import type { UseAuthReturn } from "@/hooks/use-auth";
import { Avatar } from "./avatar";
import { CharacterSelector } from "./character-selector";
import type { CharacterType } from "@/lib/linerider/characters";
import { useAuthStore } from "@/stores/auth-store";
import { useLineriderStore } from "@/stores/linerider-store";
import { X } from "lucide-react";
import { ModalDialog } from "@/components/ui/modal-dialog";

interface ProfileModalProps {
  auth: UseAuthReturn;
  onClose: () => void;
}

export function ProfileModal({ auth, onClose }: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(
    auth.profile?.displayName || ""
  );
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isBusy = auth.isLoading || isSubmitting;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const character = useLineriderStore((s) => s.character);
  const setStoreCharacter = useLineriderStore((s) => s.setCharacter);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const handleCharacterSelect = (newCharacter: CharacterType) => {
    setStoreCharacter(newCharacter);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isBusy) return;

    setIsSubmitting(true);
    try {
      await auth.updateProfile(displayName, character);
      const { error } = useAuthStore.getState();
      if (!error) {
        setSaved(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setSaved(false);
          timeoutRef.current = null;
        }, 2000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalDialog open title="Your Profile" onClose={onClose}>
      <div className="relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-0 top-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-6 text-2xl font-bold text-slate-900">Your Profile</h2>

        {auth.error ? (
          <div
            className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            role="alert"
            aria-live="polite"
          >
            {auth.error.message}
            <button
              type="button"
              onClick={auth.clearError}
              className="ml-2 font-medium underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        {saved ? (
          <div
            className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700"
            role="status"
            aria-live="polite"
          >
            ✓ Profile saved successfully!
          </div>
        ) : null}

        <div className="mb-6 flex items-center gap-4">
          <Avatar
            photoURL={auth.profile?.photoURL || auth.user?.photoURL}
            displayName={auth.profile?.displayName || auth.user?.displayName}
            email={auth.user?.email}
            size="lg"
          />
          <div>
            <p className="text-sm text-slate-500">Signed in as</p>
            <p className="font-medium text-slate-900">{auth.user?.email}</p>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label
              htmlFor="displayName"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Your name"
            />
          </div>

          <CharacterSelector
            selectedCharacter={character}
            onSelect={handleCharacterSelect}
          />

          <button
            type="submit"
            disabled={isBusy}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          >
            {auth.isLoading ? "Saving..." : "Save Profile"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <button
            type="button"
            onClick={() => void auth.signOut()}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Sign Out
          </button>
        </div>
      </div>
    </ModalDialog>
  );
}
