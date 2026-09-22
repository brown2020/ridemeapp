"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Cloud, Loader2, X } from "lucide-react";
import type { UseAuthReturn } from "@/hooks/use-auth";
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
import { ModalDialog } from "@/components/ui/modal-dialog";
import { CloudTrackList } from "./cloud-track-list";

type MyTracksModalProps = Readonly<{
  auth: UseAuthReturn;
  onClose: () => void;
  onError?: (message: string) => void;
}>;

export function MyTracksModal({ auth, onClose, onError }: MyTracksModalProps) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

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

  const uid = auth.user?.uid;

  const refreshTracks = useCallback(async () => {
    if (!uid) return;
    setIsLoadingList(true);
    setListError(null);
    try {
      setTracks(await listUserTracks(uid));
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
        await updateUserTrack(uid, cloudTrackId, name, segments, riderStart, character);
        setCloudTrackMeta(cloudTrackId, name);
        setSaveMessage("Track updated.");
      } else {
        const id = await createUserTrack(uid, name, segments, riderStart, character);
        setCloudTrackMeta(id, name);
        setSaveMessage("Track saved to cloud.");
        setShowNameForm(false);
      }
      await refreshTracks();
    } catch (err) {
      reportError(err instanceof Error ? err.message : "Could not save track.");
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
      loadTrack(cloudTrackToTrackFile(doc));
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
    if (!window.confirm(`Delete "${name}" from your cloud tracks?`)) return;
    setDeletingTrackId(trackId);
    setListError(null);
    try {
      await deleteUserTrack(uid, trackId);
      if (cloudTrackId === trackId) setCloudTrackMeta(null, null);
      await refreshTracks();
    } catch {
      reportError("Could not delete track.");
    } finally {
      setDeletingTrackId(null);
    }
  };

  return (
    <ModalDialog open title="My Tracks" onClose={onClose} size="lg">
      <div className="relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-0 top-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="mb-4 flex items-center gap-2">
          <Cloud className="h-6 w-6 text-blue-600" aria-hidden="true" />
          <h2 className="text-xl font-bold text-slate-900">My Tracks</h2>
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
          <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            {listError}
          </div>
        ) : null}

        {saveMessage ? (
          <div className="mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-700" role="status">
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

        <CloudTrackList
          tracks={tracks}
          isLoadingList={isLoadingList}
          loadingTrackId={loadingTrackId}
          deletingTrackId={deletingTrackId}
          onLoad={(id) => void handleLoad(id)}
          onDelete={(id, name) => void handleDelete(id, name)}
        />

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
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </ModalDialog>
  );
}
