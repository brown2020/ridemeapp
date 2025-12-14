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
} from "lucide-react";

// Icon button component
function IconBtn({
  active,
  variant,
  children,
  tooltip,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  variant?: "default" | "primary" | "danger";
  tooltip?: string;
}) {
  let classes =
    "relative h-9 px-2.5 flex items-center gap-1.5 text-sm font-medium rounded-md transition-all duration-150 ";

  if (variant === "primary") {
    classes += "bg-slate-700 text-white hover:bg-slate-600 shadow-sm";
  } else if (variant === "danger") {
    classes += "text-slate-500 hover:text-red-600 hover:bg-red-50";
  } else if (active) {
    classes += "bg-slate-100 text-slate-900 shadow-inner";
  } else {
    classes += "text-slate-600 hover:text-slate-900 hover:bg-slate-50";
  }

  return (
    <button className={classes} title={tooltip} {...props}>
      {children}
    </button>
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
    }))
  );

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
                <span className="text-xs">Normal</span>
              </IconBtn>
              <IconBtn
                active={lineType === "accel"}
                onClick={() => setLineType("accel")}
                tooltip="Speed boost (2)"
              >
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs">Speed</span>
              </IconBtn>
              <IconBtn
                active={lineType === "scenery"}
                onClick={() => setLineType("scenery")}
                tooltip="Decoration (3)"
              >
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span className="text-xs">Decor</span>
              </IconBtn>
            </div>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Playback Controls */}
        <div className="flex items-center gap-1.5">
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
          <select
            value={settings.playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="h-9 px-2 text-sm font-medium rounded-md border border-slate-200 bg-white text-slate-600 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 cursor-pointer"
          >
            <option value={0.25}>0.25×</option>
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
            <option value={4}>4×</option>
          </select>
        </div>

        <Separator />

        {/* View Controls */}
        <div className="flex items-center gap-0.5">
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
