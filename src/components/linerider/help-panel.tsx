"use client";

import { HelpCircle, X, Zap, Minus, Sparkles } from "lucide-react";

type HelpPanelProps = Readonly<{
  onClose: () => void;
}>;

export function HelpPanel({ onClose }: HelpPanelProps) {
  return (
<div className="pointer-events-auto absolute left-3 top-16 w-[420px] rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-5 shadow-xl shadow-slate-200/50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-slate-400" />
              <span className="font-semibold text-slate-800">
                Getting Started
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close help"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-4 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="font-medium text-slate-700 mb-2">Line Types</div>
              <div className="flex flex-col gap-1.5 text-slate-600">
                <span className="flex items-center gap-2">
                  <Minus className="w-5 h-5 text-blue-500" />
                  <span>
                    <strong>Normal</strong> — rider can grind with friction
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span>
                    <strong>Speed</strong> — gives a boost on contact
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
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
                      L
                    </kbd>{" "}
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      H/P
                    </kbd>{" "}
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      E
                    </kbd>{" "}
                    → tools
                  </div>
                  <div className="text-slate-500">
                    Line tool: click start, click end; hold Shift to snap 15°
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
                    → play/pause,{" "}
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      S
                    </kbd>{" "}
                    / Esc → stop
                  </div>
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      I
                    </kbd>{" "}
                    → set flag,{" "}
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      F
                    </kbd>{" "}
                    → jump to flag
                  </div>
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      G
                    </kbd>{" "}
                    → grid,{" "}
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      Shift+F
                    </kbd>{" "}
                    → follow rider
                  </div>
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      ⌘S
                    </kbd>{" "}
                    → save JSON,{" "}
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      ⌘O
                    </kbd>{" "}
                    → open JSON
                  </div>
                  <div>Cloud icon → My Tracks (signed in)</div>
                  <div>
                    Hold{" "}
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      Tab
                    </kbd>{" "}
                    → fit full track (pan only)
                  </div>
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      R/Home/0
                    </kbd>{" "}
                    → reset view only
                  </div>
                  <div>
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      ⌘Z
                    </kbd>{" "}
                    → undo,{" "}
                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 text-xs">
                      ⌘⇧Z
                    </kbd>{" "}
                    → redo
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  );
}
