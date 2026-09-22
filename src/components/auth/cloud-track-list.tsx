"use client";

import { FolderOpen, Loader2, Trash2 } from "lucide-react";
import type { CloudTrackSummary } from "@/lib/firebase/tracks";

function formatTrackDate(date: Date | null): string {
  if (!date) return "—";
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type CloudTrackListProps = Readonly<{
  tracks: CloudTrackSummary[];
  isLoadingList: boolean;
  loadingTrackId: string | null;
  deletingTrackId: string | null;
  onLoad: (trackId: string) => void;
  onDelete: (trackId: string, name: string) => void;
}>;

export function CloudTrackList({
  tracks,
  isLoadingList,
  loadingTrackId,
  deletingTrackId,
  onLoad,
  onDelete,
}: CloudTrackListProps) {
  return (
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
            <li key={track.id} className="flex items-center gap-2 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800">{track.name}</p>
                <p className="text-xs text-slate-500">
                  {formatTrackDate(track.updatedAt)} · {track.segmentCount} line
                  {track.segmentCount === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onLoad(track.id)}
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
                onClick={() => onDelete(track.id, track.name)}
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
  );
}
