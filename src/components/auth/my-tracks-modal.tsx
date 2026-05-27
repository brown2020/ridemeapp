"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Cloud, Trash2, FolderOpen, Loader2 } from "lucide-react";
import type { UseAuthReturn } from "@/hooks/use-auth";
import { useModalA11y } from "@/hooks/use-modal-a11y";
import { useLineriderStore } from "@/stores/linerider-store";
import { useShallow } from "zustand/react/shallow";
import {
  listUserTracks,
  getUserTrack,
  createUserTrack,
  updateUserTrack,
  deleteUserTrack,
  cloudTrackToTrackFile,
  MAX_USER_TRACKS,
  type CloudTrackSummary,
} from "@/lib/firebase/tracks";
import { shouldConfirmReplaceTrack } from "@/lib/linerider/track-file-client";
import { MAX_TRACK_NAME_LENGTH } from "@/lib/linerider/track-file";

type MyTracksModalProps = Readonly<{
  auth: UseAuthReturn;
  onClose: () => void;
  onError?: (message: string) => void;
}>;

function formatTrackDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MyTracksModal({ auth, onClose, onError }: MyTracksModalProps) {
  const titleId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [tracks, setTracks] = useState<CloudTrackSummary[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);
  const [deletingTrackId, setDeletingTrackId] = useState<string | null>(null);
  const [showNameForm, setShowNameForm] = useState(false);
  const [trackName, setTrackName] = useState("Untitled Track");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const {
    segments,
    riderStart,
    character,
    cloudTrackId,
    cloudTrackName,
    loadTrack,
    setCloudTrackMeta,
  } = useLineriderStore(
    useShallow((s) => ({
      segments: s.segments,
      riderStart: s.riderStart,
      character: s.character,
      cloudTrackId: s.cloudTrackId,
      cloudTrackName: s.cloudTrackName,
      loadTrack: s.loadTrack,
      setCloudTrackMeta: s.setCloudTrackMeta,
    }))
  );

  useModalA11y({ containerRef: modalRef, onClose, isOpen: true });

  const uid = auth.user?.uid;

  const refreshTracks = useCallback(async () => {
    if (!uid) return;
    setIsLoadingList(true);
    setListError(null);
    try {
      const items = await listUserTracks(uid);
      setTracks(items);
    } catch {
      setListError("Could not load your tracks. Try again.");
    } finally {
      setIsLoadingList(false);
    }
  }, [uid]);

  useEffect(() => {
    void refreshTracks();
  }, [refreshTracks]);

  const reportError = (message: string) => {
    if (onError) onError(message);
    else setListError(message);
  };

  const handleSave = async (nameOverride?: string) => {
    if (!uid) return;

    const name = (nameOverride ?? cloudTrackName ?? trackName).trim();
    if (!name) {
      setShowNameForm(true);
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    setListError(null);

    try {
      if (cloudTrackId) {
        await updateUserTrack(
          uid,
          cloudTrackId,
          name,
          segments,
          riderStart,
          character
        );
        setCloudTrackMeta(cloudTrackId, name);
        setSaveMessage("Track updated.");
      } else {
        const id = await createUserTrack(
          uid,
          name,
          segments,
          riderStart,
          character
        );
        setCloudTrackMeta(id, name);
        setSaveMessage("Track saved to cloud.");
        setShowNameForm(false);
      }
      await refreshTracks();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save track.";
      reportError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (cloudTrackId) {
      void handleSave();
      return;
    }
    setTrackName("Untitled Track");
    setShowNameForm(true);
  };

  const handleLoad = async (trackId: string) => {
    if (!uid) return;

    if (shouldConfirmReplaceTrack()) {
      const confirmed = window.confirm(
        "Replace the current track with the selected cloud track? Unsaved changes will be lost."
      );
      if (!confirmed) return;
    }

    setLoadingTrackId(trackId);
    setListError(null);
    try {
      const doc = await getUserTrack(uid, trackId);
      if (!doc) {
        reportError("Track not found.");
        return;
      }
      const file = cloudTrackToTrackFile(doc);
      loadTrack(file);
      setCloudTrackMeta(trackId, doc.name);
      onCloseRef.current();
    } catch {
      reportError("Could not load track.");
    } finally {
      setLoadingTrackId(null);
    }
  };

  const handleDelete = async (trackId: string, name: string) => {
    if (!uid) return;
    const confirmed = window.confirm(`Delete "${name}" from your cloud tracks?`);
    if (!confirmed) return;

    setDeletingTrackId(trackId);
    setListError(null);
    try {
      await deleteUserTrack(uid, trackId);
      if (cloudTrackId === trackId) {
        setCloudTrackMeta(null, null);
      }
      await refreshTracks();
    } catch {
      reportError("Could not delete track.");
    } finally {
      setDeletingTrackId(null);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCloseRef.current();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-modal overflow-y-auto bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div className="min-h-full px-4 py-12">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="relative mx-auto w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"
        >
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            className="absolute right-4 top-4 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="mb-4 flex items-center gap-2">
            <Cloud className="h-6 w-6 text-blue-600" aria-hidden="true" />
            <h2 id={titleId} className="text-xl font-bold text-slate-900">
              My Tracks
            </h2>
          </div>

          {cloudTrackId ? (
            <p className="mb-3 text-sm text-slate-600">
              Editing cloud track:{" "}
              <span className="font-medium text-slate-800">
                {cloudTrackName ?? "Untitled"}
              </span>
            </p>
          ) : null}

          {listError ? (
            <div
              className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
              role="alert"
            >
              {listError}
            </div>
          ) : null}

          {saveMessage ? (
            <div
              className="mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-700"
              role="status"
            >
              {saveMessage}
            </div>
          ) : null}

          {showNameForm ? (
            <form
              className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
              onSubmit={(e) => {
                e.preventDefault();
                void handleSave(trackName);
              }}
            >
              <label
                htmlFor="cloud-track-name"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Track name
              </label>
              <input
                id="cloud-track-name"
                type="text"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                maxLength={MAX_TRACK_NAME_LENGTH}
                className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSaving || !trackName.trim()}
                  className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNameForm(false)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          <div className="mb-4 max-h-64 overflow-y-auto rounded-lg border border-slate-200">
            {isLoadingList ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Loading tracks…
              </div>
            ) : tracks.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-500">
                No cloud tracks yet. Save your current canvas to get started.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {tracks.map((track) => (
                  <li
                    key={track.id}
                    className="flex items-center gap-2 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800">
                        {track.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatTrackDate(track.updatedAt)} ·{" "}
                        {track.segmentCount} line
                        {track.segmentCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleLoad(track.id)}
                      disabled={loadingTrackId !== null}
                      className="rounded-md p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                      aria-label={`Load ${track.name}`}
                    >
                      {loadingTrackId === track.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FolderOpen className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(track.id, track.name)}
                      disabled={deletingTrackId !== null}
                      className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      aria-label={`Delete ${track.name}`}
                    >
                      {deletingTrackId === track.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="mb-4 text-xs text-slate-500">
            Up to {MAX_USER_TRACKS} tracks per account.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={isSaving || !uid}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Cloud className="h-4 w-4" aria-hidden="true" />
              )}
              {cloudTrackId ? "Update cloud track" : "Save to cloud"}
            </button>
            <button
              type="button"
              onClick={() => onCloseRef.current()}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
