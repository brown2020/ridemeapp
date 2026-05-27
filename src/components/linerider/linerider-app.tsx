"use client";

import { useCallback, useEffect, useState } from "react";
import { LineriderCanvas } from "@/components/linerider/linerider-canvas";
import { LineriderControls } from "@/components/linerider/linerider-controls";
import { MyTracksModal } from "@/components/auth";
import { useLineriderStore } from "@/stores/linerider-store";
import { useShallow } from "zustand/react/shallow";
import { useAuth } from "@/hooks/use-auth";
import {
  openTrackFilePicker,
  saveTrackToFile,
} from "@/lib/linerider/track-file-client";

export function LineriderApp() {
  const auth = useAuth();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showMyTracks, setShowMyTracks] = useState(false);

  const handleOpenTrack = useCallback(async () => {
    const result = await openTrackFilePicker();
    if (!result.ok && result.error) {
      setLoadError(result.error);
    }
  }, []);

  const {
    setTool,
    setLineType,
    togglePlaying,
    stop,
    undo,
    redo,
    clearTrack,
    toggleGrid,
    toggleCameraFollowing,
    setFlag,
    jumpToFlag,
    setCharacter,
    resetCamera,
    zoomIn,
    zoomOut,
  } = useLineriderStore(
    useShallow((s) => ({
      setTool: s.setTool,
      setLineType: s.setLineType,
      togglePlaying: s.togglePlaying,
      stop: s.stop,
      undo: s.undo,
      redo: s.redo,
      clearTrack: s.clearTrack,
      toggleGrid: s.toggleGrid,
      toggleCameraFollowing: s.toggleCameraFollowing,
      setFlag: s.setFlag,
      jumpToFlag: s.jumpToFlag,
      setCharacter: s.setCharacter,
      resetCamera: s.resetCamera,
      zoomIn: s.zoomIn,
      zoomOut: s.zoomOut,
    }))
  );

  // Sync character from user profile when profile loads or changes
  useEffect(() => {
    if (auth.profile) {
      // User is logged in and profile is loaded - use their saved character
      setCharacter(auth.profile.character || "ball");
    }
    // If no profile (not logged in), keep the current character selection
  }, [auth.profile, setCharacter]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't capture if typing in an input or contenteditable element
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      if (e.defaultPrevented) return;

      const key = e.key.toLowerCase();

      if ((e.ctrlKey || e.metaKey) && key === "s") {
        e.preventDefault();
        saveTrackToFile();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && key === "o") {
        e.preventDefault();
        void handleOpenTrack();
        return;
      }

      // Undo / redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      // Playback
      if (key === " ") {
        e.preventDefault();
        togglePlaying();
        return;
      }

      if (key === "escape") {
        e.preventDefault();
        stop();
        return;
      }

      if (key === "s") {
        e.preventDefault();
        stop();
        return;
      }

      // Tools
      if (key === "d") setTool("draw");
      if (key === "l") setTool("line");
      if (key === "h" || key === "p") setTool("pan");
      if (key === "e") setTool("erase");

      // Line types (when drawing)
      if (key === "1") {
        setTool("draw");
        setLineType("normal");
      }
      if (key === "2") {
        setTool("draw");
        setLineType("accel");
      }
      if (key === "3") {
        setTool("draw");
        setLineType("scenery");
      }

      // Zoom
      if (key === "=" || key === "+") {
        e.preventDefault();
        zoomIn();
      }
      if (key === "-" || key === "_") {
        e.preventDefault();
        zoomOut();
      }

      // Flag and camera follow (F / Shift+F)
      if (key === "f") {
        if (e.shiftKey) {
          toggleCameraFollowing();
        } else {
          jumpToFlag();
        }
        return;
      }

      if (key === "i") {
        setFlag();
        return;
      }

      // Other actions
      if (key === "r" || key === "home" || key === "0") resetCamera();
      if (key === "c") clearTrack();
      if (key === "g") toggleGrid();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    clearTrack,
    resetCamera,
    setTool,
    setLineType,
    toggleCameraFollowing,
    setFlag,
    jumpToFlag,
    toggleGrid,
    togglePlaying,
    stop,
    undo,
    redo,
    zoomIn,
    zoomOut,
    handleOpenTrack,
  ]);

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-neutral-100 text-black">
      <LineriderCanvas />
      {loadError ? (
        <div
          role="alert"
          className="pointer-events-auto absolute left-1/2 top-16 z-50 flex max-w-md -translate-x-1/2 items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 shadow-lg"
        >
          <p className="flex-1">{loadError}</p>
          <button
            type="button"
            onClick={() => setLoadError(null)}
            className="shrink-0 rounded-md px-2 py-1 font-medium text-red-800 hover:bg-red-100 outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      ) : null}
      {auth.user && showMyTracks ? (
        <MyTracksModal
          auth={auth}
          onClose={() => setShowMyTracks(false)}
          onError={(message) => setLoadError(message)}
        />
      ) : null}
      <LineriderControls
        onSaveTrack={() => saveTrackToFile()}
        onOpenTrack={() => void handleOpenTrack()}
        onOpenMyTracks={
          auth.user ? () => setShowMyTracks(true) : undefined
        }
      />
    </div>
  );
}
