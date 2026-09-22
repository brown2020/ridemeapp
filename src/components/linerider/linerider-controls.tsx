"use client";

import { useState } from "react";
import { useLineriderStore } from "@/stores/linerider-store";
import { useShallow } from "zustand/react/shallow";
import { UserMenu } from "@/components/auth";
import { HelpPanel } from "./help-panel";
import { IconBtn, Separator } from "./control-chrome";
import {
  DrawingTools,
  LineTypes,
  PlaybackControls,
  ViewControls,
  FileControls,
  ActionControls,
} from "./control-toolbars";
import { Menu, X, ChevronUp, ChevronDown } from "lucide-react";

type LineriderControlsProps = Readonly<{
  onSaveTrack?: () => void;
  onOpenTrack?: () => void;
  onOpenMyTracks?: () => void;
}>;

export function LineriderControls({
  onSaveTrack,
  onOpenTrack,
  onOpenMyTracks,
}: LineriderControlsProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const {
    tool,
    setTool,
    lineType,
    setLineType,
    isPlaying,
    togglePlaying,
    stop,
    undo,
    redo,
    canRedo,
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
      stop: s.stop,
      undo: s.undo,
      redo: s.redo,
      canRedo: s.redoHistory.length > 0,
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



  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {/* Compact Toolbar (below lg) */}
      <div className="pointer-events-auto lg:hidden absolute left-2 right-2 top-2 rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur-sm shadow-lg shadow-slate-200/50">
        {/* Top bar */}
        <div className="flex items-center gap-1 px-2 py-1.5">
          <IconBtn
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            tooltip="Menu"
          >
            {showMobileMenu ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </IconBtn>

          <IconBtn onClick={() => setShowHelp(!showHelp)} tooltip="Help">
            <span className="font-semibold text-slate-800">Ride.me</span>
          </IconBtn>

          <div className="flex-1" />

          <PlaybackControls
            isPlaying={isPlaying}
            togglePlaying={togglePlaying}
            stop={stop}
            playbackSpeed={settings.playbackSpeed}
            setPlaybackSpeed={setPlaybackSpeed}
          />

          <Separator />

          <UserMenu />
        </div>

        {/* Expandable menu */}
        {showMobileMenu && (
          <div className="border-t border-slate-200 px-2 py-2">
            <div className="flex items-center gap-2 flex-wrap">
              <DrawingTools tool={tool} setTool={setTool} />
              {tool === "draw" ? (
                <LineTypes lineType={lineType} setLineType={setLineType} />
              ) : null}
              <ViewControls
            zoom={zoom}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            isGridVisible={settings.isGridVisible}
            toggleGrid={toggleGrid}
            isCameraFollowing={settings.isCameraFollowing}
            toggleCameraFollowing={toggleCameraFollowing}
            resetCamera={resetCamera}
          />
              <FileControls
            onSaveTrack={onSaveTrack}
            onOpenTrack={onOpenTrack}
            onOpenMyTracks={onOpenMyTracks}
          />
              <ActionControls
            undo={undo}
            redo={redo}
            canRedo={canRedo}
            clearTrack={clearTrack}
          />
            </div>
          </div>
        )}
      </div>

      {/* Full Toolbar (lg and above) */}
      <div className="pointer-events-auto hidden lg:flex absolute left-3 right-3 top-3 items-center gap-1 rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur-sm px-2 py-1.5 shadow-lg shadow-slate-200/50">
        {/* Logo & Help */}
        <IconBtn onClick={() => setShowHelp(!showHelp)} tooltip="Help">
          <span className="font-semibold text-slate-800">Ride.me</span>
          {showHelp ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </IconBtn>

        <Separator />

        <DrawingTools tool={tool} setTool={setTool} />

        {tool === "draw" && (
          <>
            <Separator />
            <LineTypes lineType={lineType} setLineType={setLineType} />
          </>
        )}

        <div className="flex-1" />

        <PlaybackControls
            isPlaying={isPlaying}
            togglePlaying={togglePlaying}
            stop={stop}
            playbackSpeed={settings.playbackSpeed}
            setPlaybackSpeed={setPlaybackSpeed}
          />

        <Separator />

        <ViewControls
            zoom={zoom}
            zoomIn={zoomIn}
            zoomOut={zoomOut}
            isGridVisible={settings.isGridVisible}
            toggleGrid={toggleGrid}
            isCameraFollowing={settings.isCameraFollowing}
            toggleCameraFollowing={toggleCameraFollowing}
            resetCamera={resetCamera}
          />

        <Separator />

        <FileControls
            onSaveTrack={onSaveTrack}
            onOpenTrack={onOpenTrack}
            onOpenMyTracks={onOpenMyTracks}
          />

        <Separator />

        <ActionControls
            undo={undo}
            redo={redo}
            canRedo={canRedo}
            clearTrack={clearTrack}
          />

        <Separator />

        <UserMenu />
      </div>

      {/* Help Panel */}
      {showHelp ? <HelpPanel onClose={() => setShowHelp(false)} /> : null}

    </div>
  );
}
