import { useLineriderStore } from "@/stores/linerider-store";
import {
  MAX_TRACK_FILE_BYTES,
  parseTrackFile,
  serializeTrackFile,
  trackNameToFilename,
  type TrackFileV1,
} from "./track-file";

export function trackHasContent(): boolean {
  return useLineriderStore.getState().segments.length > 0;
}

export function saveTrackToFile(name?: string): void {
  const state = useLineriderStore.getState();
  const resolved =
    name?.trim() ||
    state.trackName?.trim() ||
    state.cloudTrackName?.trim() ||
    "Untitled Track";
  const json = serializeTrackFile(
    state.segments,
    state.riderStart,
    state.character,
    resolved
  );
  const filename = trackNameToFilename(resolved);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function shouldConfirmReplaceTrack(): boolean {
  return trackHasContent();
}

export function applyTrackFile(data: TrackFileV1): void {
  useLineriderStore.getState().loadTrack(data);
}

export async function readTrackFile(file: File): Promise<
  | { ok: true; data: TrackFileV1 }
  | { ok: false; error: string }
> {
  if (file.size > MAX_TRACK_FILE_BYTES) {
    return { ok: false, error: "Track file is too large." };
  }
  try {
    const text = await file.text();
    return parseTrackFile(text);
  } catch {
    return { ok: false, error: "Could not read the selected file." };
  }
}

/** Programmatic file picker (for Open button and ⌘O). */
export function pickTrackJsonFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.display = "none";
    let settled = false;
    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(file);
    };
    input.addEventListener(
      "change",
      () => {
        finish(input.files?.[0] ?? null);
      },
      { once: true }
    );
    input.addEventListener("cancel", () => finish(null), { once: true });
    document.body.appendChild(input);
    input.click();
  });
}

export async function loadTrackFromPickedFile(
  file: File,
  options?: Readonly<{ skipConfirm?: boolean }>
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!options?.skipConfirm && shouldConfirmReplaceTrack()) {
    const confirmed = window.confirm(
      "Replace the current track with the loaded file? Unsaved changes will be lost."
    );
    if (!confirmed) {
      return { ok: false, error: "" };
    }
  }

  const parsed = await readTrackFile(file);
  if (!parsed.ok) {
    return parsed;
  }

  applyTrackFile(parsed.data);
  return { ok: true };
}

export async function openTrackFilePicker(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const file = await pickTrackJsonFile();
  if (!file) {
    return { ok: false, error: "" };
  }
  return loadTrackFromPickedFile(file);
}
