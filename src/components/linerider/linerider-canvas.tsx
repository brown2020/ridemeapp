"use client";

import { useLineriderCanvasEngine } from "./use-linerider-canvas-engine";

export function LineriderCanvas() {
  const { canvasRef, className, style, onContextMenu } =
    useLineriderCanvasEngine();

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={style}
      onContextMenu={onContextMenu}
      aria-label="Line Rider canvas - Draw lines, play simulation, use keyboard shortcuts for tools"
    />
  );
}
