"use client";

import type React from "react";
import { useLineriderStore } from "@/stores/linerider-store";
import { useShallow } from "zustand/react/shallow";
import type { LineType } from "@/lib/linerider/math";
import { UserMenu } from "@/components/auth";

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Button({ 
  isActive, 
  ...props 
}: Readonly<React.ComponentProps<"button"> & { isActive?: boolean }>) {
  return (
    <button
      {...props}
      className={clsx(
        "rounded-md border px-2 py-1 text-xs font-medium shadow-sm transition-colors",
        isActive
          ? "border-black/40 bg-gray-900 text-white hover:bg-gray-800"
          : "border-black/20 bg-white text-black hover:bg-black/5 active:bg-black/10",
        "disabled:opacity-50",
        props.className
      )}
    />
  );
}

function LineTypeButton({
  type,
  label,
  color,
  shortcut,
  currentType,
  onClick,
}: {
  type: LineType;
  label: string;
  color: string;
  shortcut: string;
  currentType: LineType;
  onClick: () => void;
}) {
  const isActive = currentType === type;
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
        isActive
          ? "border-black/40 bg-black/5"
          : "border-black/10 bg-white hover:bg-black/5"
      )}
    >
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
      <span className="opacity-50">({shortcut})</span>
    </button>
  );
}

export function LineriderControls() {
  const {
    tool,
    setTool,
    lineType,
    setLineType,
    isPlaying,
    togglePlaying,
    resetRider,
    undo,
    clearTrack,
    settings,
    toggleGrid,
    toggleCameraFollowing,
    setPlaybackSpeed,
  } = useLineriderStore(
    useShallow((s) => ({
      tool: s.tool,
      setTool: s.setTool,
      lineType: s.lineType,
      setLineType: s.setLineType,
      isPlaying: s.isPlaying,
      togglePlaying: s.togglePlaying,
      resetRider: s.resetRider,
      undo: s.undo,
      clearTrack: s.clearTrack,
      settings: s.settings,
      toggleGrid: s.toggleGrid,
      toggleCameraFollowing: s.toggleCameraFollowing,
      setPlaybackSpeed: s.setPlaybackSpeed,
    }))
  );

  const toolHints = {
    draw: "Draw: drag to create lines",
    pan: "Pan: drag to move view",
    erase: "Erase: drag to remove lines",
  };

  const lineTypeInfo = {
    normal: { color: "#4488ff", label: "Normal", shortcut: "1" },
    accel: { color: "#cc2222", label: "Speed", shortcut: "2" },
    scenery: { color: "#22aa44", label: "Scenery", shortcut: "3" },
  };

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {/* Top-right user menu */}
      <div className="pointer-events-auto absolute right-3 top-3">
        <UserMenu />
      </div>

      {/* Top-left controls */}
      <div className="pointer-events-auto absolute left-3 top-3 flex flex-col gap-2">
        {/* Tool bar */}
        <div className="flex flex-wrap gap-2 rounded-lg border border-black/10 bg-white/90 p-2 shadow-lg backdrop-blur-sm">
          <Button
            onClick={() => setTool("draw")}
            isActive={tool === "draw"}
            title="Draw tool (D)"
          >
            ✏️ Draw
          </Button>
          <Button
            onClick={() => setTool("pan")}
            isActive={tool === "pan"}
            title="Pan tool (H/P)"
          >
            ✋ Pan
          </Button>
          <Button
            onClick={() => setTool("erase")}
            isActive={tool === "erase"}
            title="Erase tool (E)"
          >
            🧹 Erase
          </Button>

          <div className="mx-1 w-px self-stretch bg-black/10" />

          <Button
            onClick={toggleGrid}
            isActive={settings.isGridVisible}
            title="Toggle grid (G)"
          >
            Grid
          </Button>
          <Button
            onClick={toggleCameraFollowing}
            isActive={settings.isCameraFollowing}
            title="Follow rider (F)"
          >
            Follow
          </Button>
        </div>

        {/* Line type selector (only visible in draw mode) */}
        {tool === "draw" && (
          <div className="flex flex-wrap gap-2 rounded-lg border border-black/10 bg-white/90 p-2 shadow-lg backdrop-blur-sm">
            <span className="self-center text-xs text-black/60">Line:</span>
            {(
              Object.entries(lineTypeInfo) as [
                LineType,
                typeof lineTypeInfo.normal
              ][]
            ).map(([type, info]) => (
              <LineTypeButton
                key={type}
                type={type}
                label={info.label}
                color={info.color}
                shortcut={info.shortcut}
                currentType={lineType}
                onClick={() => setLineType(type)}
              />
            ))}
          </div>
        )}

        {/* Playback controls */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-black/10 bg-white/90 p-2 shadow-lg backdrop-blur-sm">
          <Button
            onClick={togglePlaying}
            className={isPlaying ? "!bg-emerald-600 !text-white !hover:bg-emerald-500 !border-emerald-700" : ""}
            title="Play/Pause (Space)"
          >
            {isPlaying ? "⏸ Pause" : "▶️ Play"}
          </Button>
          <Button onClick={resetRider} title="Reset rider (R)">
            🔄 Reset
          </Button>

          <div className="mx-1 w-px self-stretch bg-black/10" />

          <span className="text-xs text-black/60">Speed:</span>
          <select
            value={settings.playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="rounded border border-black/20 bg-white px-1.5 py-0.5 text-xs"
          >
            <option value={0.25}>0.25x</option>
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>

          <div className="mx-1 w-px self-stretch bg-black/10" />

          <Button onClick={undo} title="Undo (⌘/Ctrl+Z)">
            ↩️ Undo
          </Button>
          <Button onClick={clearTrack} title="Clear all (C)">
            🗑️ Clear
          </Button>
        </div>

        {/* Help text */}
        <div className="max-w-[400px] rounded-lg border border-black/10 bg-white/90 p-2 text-xs text-black/70 shadow-lg backdrop-blur-sm">
          <div className="font-semibold text-black">OpenRider</div>
          <div className="mt-1">{toolHints[tool]}</div>
          <div className="mt-1 space-y-0.5 text-[10px] opacity-80">
            <div>🖱️ Wheel: zoom · Middle/Right drag: pan</div>
            <div>⇧ Shift+Click: set rider start position</div>
            <div>⌨️ D/H/E: tools · 1/2/3: line types · Space: play</div>
          </div>
        </div>
      </div>
    </div>
  );
}
