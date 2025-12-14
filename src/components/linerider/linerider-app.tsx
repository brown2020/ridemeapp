"use client";

import { useEffect } from "react";
import { LineriderCanvas } from "@/components/linerider/linerider-canvas";
import { LineriderControls } from "@/components/linerider/linerider-controls";
import { useLineriderStore } from "@/stores/linerider-store";
import { useShallow } from "zustand/react/shallow";

export function LineriderApp() {
  const {
    setTool,
    setLineType,
    togglePlaying,
    resetRider,
    undo,
    clearTrack,
    toggleGrid,
    toggleCameraFollowing,
  } = useLineriderStore(
    useShallow((s) => ({
      setTool: s.setTool,
      setLineType: s.setLineType,
      togglePlaying: s.togglePlaying,
      resetRider: s.resetRider,
      undo: s.undo,
      clearTrack: s.clearTrack,
      toggleGrid: s.toggleGrid,
      toggleCameraFollowing: s.toggleCameraFollowing,
    }))
  );

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
      if (key === "r") resetRider();
      if (key === "c") clearTrack();
      if (key === "g") toggleGrid();
      if (key === "f") toggleCameraFollowing();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    clearTrack,
    resetRider,
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
