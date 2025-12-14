"use client";

import { useEffect } from "react";
import { LineriderCanvas } from "@/components/linerider/linerider-canvas";
import { LineriderControls } from "@/components/linerider/linerider-controls";
import { useLineriderStore } from "@/stores/linerider-store";
import { useShallow } from "zustand/react/shallow";
import { useAuth } from "@/hooks/use-auth";

export function LineriderApp() {
  const auth = useAuth();
  
  const {
    setTool,
    setLineType,
    togglePlaying,
    undo,
    clearTrack,
    toggleGrid,
    toggleCameraFollowing,
    setCharacter,
    resetCamera,
  } = useLineriderStore(
    useShallow((s) => ({
      setTool: s.setTool,
      setLineType: s.setLineType,
      togglePlaying: s.togglePlaying,
      undo: s.undo,
      clearTrack: s.clearTrack,
      toggleGrid: s.toggleGrid,
      toggleCameraFollowing: s.toggleCameraFollowing,
      setCharacter: s.setCharacter,
      resetCamera: s.resetCamera,
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
      // Don't capture if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.defaultPrevented) return;

      // Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
        return;
      }

      const key = e.key.toLowerCase();

      // Playback
      if (key === " ") {
        e.preventDefault();
        togglePlaying();
        return;
      }

      // Tools
      if (key === "d") setTool("draw");
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

      // Other actions
      if (key === "r" || key === "home" || key === "0") resetCamera();
      if (key === "c") clearTrack();
      if (key === "g") toggleGrid();
      if (key === "f") toggleCameraFollowing();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    clearTrack,
    resetCamera,
    setTool,
    setLineType,
    toggleCameraFollowing,
    toggleGrid,
    togglePlaying,
    undo,
  ]);

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-neutral-100 text-black">
      <LineriderCanvas />
      <LineriderControls />
    </div>
  );
}
