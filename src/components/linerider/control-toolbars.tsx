"use client";

import {
  Pencil,
  Ruler,
  Hand,
  Eraser,
  Play,
  Pause,
  Square,
  Grid3X3,
  Focus,
  Home,
  Undo2,
  Redo2,
  Trash2,
  Zap,
  Minus,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Turtle,
  Rabbit,
  Download,
  FolderOpen,
  Cloud,
} from "lucide-react";
import { PLAYBACK_SPEEDS } from "@/stores/linerider-store";
import { ZOOM } from "@/lib/linerider/constants";
import { IconBtn } from "./control-chrome";

type Tool = "draw" | "line" | "pan" | "erase";
type LineType = "normal" | "accel" | "scenery";

export function DrawingTools({
  tool,
  setTool,
}: {
  tool: Tool;
  setTool: (t: Tool) => void;
}) {
  return (
    <div className="flex items-center space-x-1 bg-slate-50 rounded-lg p-0.5">
      <IconBtn active={tool === "draw"} onClick={() => setTool("draw")} tooltip="Draw (D)">
        <Pencil className="w-5 h-5" />
      </IconBtn>
      <IconBtn active={tool === "line"} onClick={() => setTool("line")} tooltip="Straight line (L)" aria-label="Straight line tool">
        <Ruler className="w-5 h-5" />
      </IconBtn>
      <IconBtn active={tool === "pan"} onClick={() => setTool("pan")} tooltip="Pan (H)">
        <Hand className="w-5 h-5" />
      </IconBtn>
      <IconBtn active={tool === "erase"} onClick={() => setTool("erase")} tooltip="Erase (E)">
        <Eraser className="w-5 h-5" />
      </IconBtn>
    </div>
  );
}

export function LineTypes({
  lineType,
  setLineType,
}: {
  lineType: LineType;
  setLineType: (t: LineType) => void;
}) {
  return (
    <div className="flex items-center space-x-1 bg-slate-50 rounded-lg p-0.5">
      <IconBtn active={lineType === "normal"} onClick={() => setLineType("normal")} tooltip="Normal line (1)">
        <Minus className="w-5 h-5 text-blue-500" />
      </IconBtn>
      <IconBtn active={lineType === "accel"} onClick={() => setLineType("accel")} tooltip="Speed boost (2)">
        <Zap className="w-5 h-5 text-amber-500" />
      </IconBtn>
      <IconBtn active={lineType === "scenery"} onClick={() => setLineType("scenery")} tooltip="Decoration (3)">
        <Sparkles className="w-5 h-5 text-emerald-500" />
      </IconBtn>
    </div>
  );
}

export function PlaybackControls({
  isPlaying,
  togglePlaying,
  stop,
  playbackSpeed,
  setPlaybackSpeed,
}: {
  isPlaying: boolean;
  togglePlaying: () => void;
  stop: () => void;
  playbackSpeed: number;
  setPlaybackSpeed: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <IconBtn variant="primary" onClick={togglePlaying} tooltip={isPlaying ? "Pause (Space)" : "Play (Space)"} aria-label={isPlaying ? "Pause" : "Play"}>
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </IconBtn>
      <IconBtn onClick={stop} tooltip="Stop (S)" aria-label="Stop and reset rider to start">
        <Square className="w-5 h-5" />
      </IconBtn>
      <div className="flex items-center space-x-1 bg-slate-50 rounded-lg p-0.5">
        <IconBtn
          onClick={() => {
            const idx = PLAYBACK_SPEEDS.indexOf(playbackSpeed as (typeof PLAYBACK_SPEEDS)[number]);
            if (idx > 0) setPlaybackSpeed(PLAYBACK_SPEEDS[idx - 1]);
          }}
          tooltip="Slower"
          disabled={playbackSpeed <= PLAYBACK_SPEEDS[0]}
        >
          <Turtle className="w-5 h-5" />
        </IconBtn>
        <span className="text-xs text-slate-500 min-w-8 text-center font-medium">{playbackSpeed}×</span>
        <IconBtn
          onClick={() => {
            const idx = PLAYBACK_SPEEDS.indexOf(playbackSpeed as (typeof PLAYBACK_SPEEDS)[number]);
            if (idx < PLAYBACK_SPEEDS.length - 1) setPlaybackSpeed(PLAYBACK_SPEEDS[idx + 1]);
          }}
          tooltip="Faster"
          disabled={playbackSpeed >= PLAYBACK_SPEEDS[PLAYBACK_SPEEDS.length - 1]}
        >
          <Rabbit className="w-5 h-5" />
        </IconBtn>
      </div>
    </div>
  );
}

export function ViewControls({
  zoom,
  zoomIn,
  zoomOut,
  isGridVisible,
  toggleGrid,
  isCameraFollowing,
  toggleCameraFollowing,
  resetCamera,
}: {
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  isGridVisible: boolean;
  toggleGrid: () => void;
  isCameraFollowing: boolean;
  toggleCameraFollowing: () => void;
  resetCamera: () => void;
}) {
  return (
    <div className="flex items-center space-x-1">
      <IconBtn onClick={zoomOut} tooltip="Zoom out (-)" disabled={zoom <= ZOOM.MIN}>
        <ZoomOut className="w-5 h-5" />
      </IconBtn>
      <IconBtn onClick={zoomIn} tooltip="Zoom in (+)" disabled={zoom >= ZOOM.MAX}>
        <ZoomIn className="w-5 h-5" />
      </IconBtn>
      <IconBtn active={isGridVisible} onClick={toggleGrid} tooltip="Toggle grid (G)">
        <Grid3X3 className="w-5 h-5" />
      </IconBtn>
      <IconBtn active={isCameraFollowing} onClick={toggleCameraFollowing} tooltip="Follow rider (Shift+F)">
        <Focus className="w-5 h-5" />
      </IconBtn>
      <IconBtn onClick={resetCamera} tooltip="Reset view only (R / Home)">
        <Home className="w-5 h-5" />
      </IconBtn>
    </div>
  );
}

export function FileControls({
  onSaveTrack,
  onOpenTrack,
  onOpenMyTracks,
}: {
  onSaveTrack?: () => void;
  onOpenTrack?: () => void;
  onOpenMyTracks?: () => void;
}) {
  return (
    <div className="flex items-center space-x-1">
      <IconBtn onClick={onSaveTrack} tooltip="Save track (⌘S)" aria-label="Save track to JSON file" disabled={!onSaveTrack}>
        <Download className="w-5 h-5" />
      </IconBtn>
      <IconBtn onClick={onOpenTrack} tooltip="Open track (⌘O)" aria-label="Open track from JSON file" disabled={!onOpenTrack}>
        <FolderOpen className="w-5 h-5" />
      </IconBtn>
      <IconBtn onClick={onOpenMyTracks} tooltip="My cloud tracks" aria-label="Open My Tracks" disabled={!onOpenMyTracks}>
        <Cloud className="w-5 h-5" />
      </IconBtn>
    </div>
  );
}

export function ActionControls({
  undo,
  redo,
  canRedo,
  clearTrack,
}: {
  undo: () => void;
  redo: () => void;
  canRedo: boolean;
  clearTrack: () => void;
}) {
  return (
    <div className="flex items-center space-x-1">
      <IconBtn onClick={undo} tooltip="Undo (⌘Z)">
        <Undo2 className="w-5 h-5" />
      </IconBtn>
      <IconBtn onClick={redo} disabled={!canRedo} tooltip="Redo (⌘⇧Z)" aria-label="Redo">
        <Redo2 className="w-5 h-5" />
      </IconBtn>
      <IconBtn variant="danger" onClick={clearTrack} tooltip="Clear all">
        <Trash2 className="w-5 h-5" />
      </IconBtn>
    </div>
  );
}
