"use client";

import { useState } from "react";
import { useLineriderStore } from "@/stores/linerider-store";
import { useShallow } from "zustand/react/shallow";
import { UserMenu } from "@/components/auth";
import {
  Pencil,
  Hand,
  Eraser,
  Play,
  Pause,
  Grid3X3,
  Focus,
  Home,
  Undo2,
  Trash2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  X,
  Zap,
  Minus,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Turtle,
  Rabbit,
} from "lucide-react";

// Available playback speeds
const SPEEDS = [0.25, 0.5, 1, 2, 4] as const;

// Tooltip wrapper component
function Tooltip({
  children,
  text,
}: {
  children: React.ReactNode;
  text?: string;
}) {
  if (!text) return <>{children}</>;

  return (
    <div className="relative group/tooltip">
      {children}
      <div className="pointer-events-none absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2 opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100">
        <div className="whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg">
          {text}
          <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-800" />
        </div>
      </div>
    </div>
  );
}

// Icon button component
function IconBtn({
  active,
  variant,
  children,
  tooltip,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  variant?: "default" | "primary" | "danger";
  tooltip?: string;
}) {
  let classes =
    "relative h-9 px-2.5 flex items-center gap-1.5 text-sm font-medium rounded-md transition-all duration-150 ";

  if (disabled) {
    classes += "text-slate-300 cursor-not-allowed";
  } else if (variant === "primary") {
    classes += "bg-slate-700 text-white hover:bg-slate-600 shadow-sm";
  } else if (variant === "danger") {
    classes += "text-slate-500 hover:text-red-600 hover:bg-red-50";
  } else if (active) {
    classes += "bg-slate-200 text-slate-900 ring-1 ring-slate-300";
  } else {
    classes += "text-slate-500 hover:text-slate-700 hover:bg-slate-100";
  }

  return (
    <Tooltip text={disabled ? undefined : tooltip}>
      <button className={classes} disabled={disabled} {...props}>
        {children}
      </button>
    </Tooltip>
  );
}

// Separator component
function Separator() {
  return <div className="w-px h-6 bg-slate-200 mx-1" />;
}

export function LineriderControls() {
  const [showHelp, setShowHelp] = useState(false);

  const {
    tool,
    setTool,
    lineType,
    setLineType,
    isPlaying,
    togglePlaying,
    undo,
    clearTrack,
    settings,
    toggleGrid,
    toggleCameraFollowing,
    setPlaybackSpeed,
    resetCamera,
    zoomIn,
    zoomOut,
    zoom,
  } = useLineriderStore(
    useShallow((s) => ({
      tool: s.tool,
      setTool: s.setTool,
      lineType: s.lineType,
      setLineType: s.setLineType,
      isPlaying: s.isPlaying,
      togglePlaying: s.togglePlaying,
      undo: s.undo,
      clearTrack: s.clearTrack,
      settings: s.settings,
      toggleGrid: s.toggleGrid,
      toggleCameraFollowing: s.toggleCameraFollowing,
      setPlaybackSpeed: s.setPlaybackSpeed,
      resetCamera: s.resetCamera,
      zoomIn: s.zoomIn,
      zoomOut: s.zoomOut,
      zoom: s.camera.zoom,
    }))
  );

  // Zoom limits (must match store)
  const MIN_ZOOM = 0.2;
  const MAX_ZOOM = 5;

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {/* Toolbar */}
      <div className="pointer-events-auto absolute left-3 right-3 top-3 flex items-center gap-1 rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur-sm px-2 py-1.5 shadow-lg shadow-slate-200/50">
        {/* Logo & Help */}
        <IconBtn onClick={() => setShowHelp(!showHelp)} tooltip="Help">
          <span className="font-semibold text-slate-800">Ride.me</span>
          {showHelp ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </IconBtn>

        <Separator />

        {/* Drawing Tools */}
        <div className="flex items-center gap-0.5 bg-slate-50 rounded-lg p-0.5">
          <IconBtn
            active={tool === "draw"}
            onClick={() => setTool("draw")}
            tooltip="Draw (D)"
          >
            <Pencil className="w-4 h-4" />
          </IconBtn>
          <IconBtn
            active={tool === "pan"}
            onClick={() => setTool("pan")}
            tooltip="Pan (H)"
          >
            <Hand className="w-4 h-4" />
          </IconBtn>
          <IconBtn
            active={tool === "erase"}
            onClick={() => setTool("erase")}
            tooltip="Erase (E)"
          >
            <Eraser className="w-4 h-4" />
          </IconBtn>
        </div>

        {/* Line Types - only in draw mode */}
        {tool === "draw" && (
          <>
            <Separator />
            <div className="flex items-center gap-0.5 bg-slate-50 rounded-lg p-0.5">
              <IconBtn
                active={lineType === "normal"}
                onClick={() => setLineType("normal")}
                tooltip="Normal line (1)"
              >
                <Minus className="w-4 h-4 text-blue-500" />
              </IconBtn>
              <IconBtn
                active={lineType === "accel"}
                onClick={() => setLineType("accel")}
                tooltip="Speed boost (2)"
              >
                <Zap className="w-4 h-4 text-amber-500" />
              </IconBtn>
              <IconBtn
                active={lineType === "scenery"}
                onClick={() => setLineType("scenery")}
                tooltip="Decoration (3)"
              >
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </IconBtn>
            </div>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Playback Controls */}
        <div className="flex items-center gap-1">
          <IconBtn
            variant="primary"
            onClick={togglePlaying}
            tooltip={isPlaying ? "Pause (Space)" : "Play (Space)"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </IconBtn>
          <div className="flex items-center gap-0.5 bg-slate-50 rounded-lg p-0.5">
            <IconBtn
              onClick={() => {
                const idx = SPEEDS.indexOf(
                  settings.playbackSpeed as (typeof SPEEDS)[number]
                );
                if (idx > 0) setPlaybackSpeed(SPEEDS[idx - 1]);
              }}
              tooltip={`Slower (${
                settings.playbackSpeed <= SPEEDS[0]
                  ? "min"
                  : SPEEDS[
                      Math.max(
                        0,
                        SPEEDS.indexOf(
                          settings.playbackSpeed as (typeof SPEEDS)[number]
                        ) - 1
                      )
                    ] + "×"
              })`}
              disabled={settings.playbackSpeed <= SPEEDS[0]}
            >
              <Turtle className="w-4 h-4" />
            </IconBtn>
            <span className="text-xs text-slate-500 min-w-8 text-center font-medium">
              {settings.playbackSpeed}×
            </span>
            <IconBtn
              onClick={() => {
                const idx = SPEEDS.indexOf(
                  settings.playbackSpeed as (typeof SPEEDS)[number]
                );
                if (idx < SPEEDS.length - 1) setPlaybackSpeed(SPEEDS[idx + 1]);
              }}
              tooltip={`Faster (${
                settings.playbackSpeed >= SPEEDS[SPEEDS.length - 1]
                  ? "max"
                  : SPEEDS[
                      Math.min(
                        SPEEDS.length - 1,
                        SPEEDS.indexOf(
                          settings.playbackSpeed as (typeof SPEEDS)[number]
                        ) + 1
                      )
                    ] + "×"
              })`}
              disabled={settings.playbackSpeed >= SPEEDS[SPEEDS.length - 1]}
            >
              <Rabbit className="w-4 h-4" />
            </IconBtn>
          </div>
        </div>

        <Separator />

        {/* View Controls */}
        <div className="flex items-center gap-0.5">
          <IconBtn
            onClick={zoomOut}
            tooltip="Zoom out (-)"
            disabled={zoom <= MIN_ZOOM}
          >
            <ZoomOut className="w-4 h-4" />
          </IconBtn>
          <IconBtn
            onClick={zoomIn}
            tooltip="Zoom in (+)"
            disabled={zoom >= MAX_ZOOM}
          >
            <ZoomIn className="w-4 h-4" />
          </IconBtn>
          <IconBtn
            active={settings.isGridVisible}
            onClick={toggleGrid}
            tooltip="Toggle grid (G)"
          >
            <Grid3X3 className="w-4 h-4" />
          </IconBtn>
          <IconBtn
            active={settings.isCameraFollowing}
            onClick={toggleCameraFollowing}
            tooltip="Follow rider (F)"
          >
            <Focus className="w-4 h-4" />
          </IconBtn>
          <IconBtn onClick={resetCamera} tooltip="Reset view (Home)">
            <Home className="w-4 h-4" />
          </IconBtn>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <IconBtn onClick={undo} tooltip="Undo (⌘Z)">
            <Undo2 className="w-4 h-4" />
          </IconBtn>
          <IconBtn variant="danger" onClick={clearTrack} tooltip="Clear all">
            <Trash2 className="w-4 h-4" />
          </IconBtn>
        </div>

        <Separator />

        {/* User */}
        <UserMenu />
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="pointer-events-auto absolute left-3 top-16 w-[420px] rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-5 shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-slate-400" />
              <span className="font-semibold text-slate-800">
                Getting Started
              </span>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="font-medium text-slate-700 mb-2">Line Types</div>
              <div className="flex flex-col gap-1.5 text-slate-600">
                <span className="flex items-center gap-2">
                  <Minus className="w-4 h-4 text-blue-500" />
                  <span>
                    <strong>Normal</strong> — rider can grind with friction
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>
                    <strong>Speed</strong> — gives a boost on contact
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>
                    <strong>Decor</strong> — visual only, no collision
                  </span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="font-medium text-slate-700 mb-2">Mouse</div>
                <div className="text-slate-600 space-y-1">
                  <div>Left drag → draw/erase</div>
                  <div>Scroll → zoom</div>
                  <div>Right drag → pan</div>
                  <div>Shift+click → set start</div>
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      +
                    </kbd>{" "}
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      -
                    </kbd>{" "}
                    → zoom
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="font-medium text-slate-700 mb-2">Keyboard</div>
                <div className="text-slate-600 space-y-1">
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      D
                    </kbd>{" "}
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      H
                    </kbd>{" "}
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      E
                    </kbd>{" "}
                    → tools
                  </div>
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      1
                    </kbd>{" "}
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      2
                    </kbd>{" "}
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      3
                    </kbd>{" "}
                    → line types
                  </div>
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      Space
                    </kbd>{" "}
                    → play/pause
                  </div>
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      ⌘Z
                    </kbd>{" "}
                    → undo
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
