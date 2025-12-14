"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import {
  useLineriderStore,
  getRiderVelocity,
} from "@/stores/linerider-store";
import type { Viewport } from "@/lib/linerider/types";
import { sub, len, v, type Vec2 } from "@/lib/linerider/math";
import { screenToWorld } from "@/lib/linerider/transform";
import {
  drawGrid,
  drawSegments,
  drawStartFlag,
  drawHUD,
  buildSegmentPaths,
} from "@/lib/linerider/renderer";
import { drawCharacter } from "@/lib/linerider/characters";

type PointerMode = "draw" | "pan" | "erase" | null;

const MIN_DRAW_DIST_PX = 3;
const PHYSICS_DT = 1 / 60; // Fixed physics timestep

/** Helper to get screen position from pointer event */
function screenFromEvent(e: PointerEvent, el: HTMLCanvasElement): Vec2 {
  const rect = el.getBoundingClientRect();
  return v(e.clientX - rect.left, e.clientY - rect.top);
}

export function LineriderCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<Viewport>({ width: 0, height: 0 });

  // Pointer interaction state
  const pointerModeRef = useRef<PointerMode>(null);
  const pointerIdRef = useRef<number | null>(null);
  const lastScreenRef = useRef<Vec2>(v(0, 0));
  const lastWorldRef = useRef<Vec2>(v(0, 0));
  const strokeSegmentsRef = useRef<Array<Readonly<{ a: Vec2; b: Vec2 }>>>([]);
  const erasePointsRef = useRef<Vec2[]>([]);
  const isInteractingRef = useRef<boolean>(false);

  // Animation state
  const rafRef = useRef<number | null>(null);
  const lastFrameMsRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);

  // Render caching
  const segmentPathsRef = useRef<Map<string, Path2D> | null>(null);
  const segmentPathsVersionRef = useRef<number>(-1);
  const needsRenderRef = useRef<boolean>(true);

  const tool = useLineriderStore((s) => s.tool);

  // Initialize viewport on mount
  useLayoutEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const updateViewport = () => {
      const rect = el.getBoundingClientRect();
      viewportRef.current = {
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
      };
      needsRenderRef.current = true;
    };

    updateViewport();

    const ro = new ResizeObserver(updateViewport);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Main animation loop
  useEffect(() => {
    let mounted = true;

    function renderLoop(nowMs: number) {
      rafRef.current = null;
      if (!mounted) return;

      const el = canvasRef.current;
      if (!el) return;

      const ctx = el.getContext("2d");
      if (!ctx) return;

      const viewport = viewportRef.current;

      // Handle canvas sizing
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const targetW = Math.floor(viewport.width * dpr);
      const targetH = Math.floor(viewport.height * dpr);

      if (el.width !== targetW || el.height !== targetH) {
        el.width = targetW;
        el.height = targetH;
      }

      // Get fresh state for physics
      let state = useLineriderStore.getState();

      // Calculate delta time for physics
      const dtMs =
        lastFrameMsRef.current === 0
          ? 16
          : Math.min(50, nowMs - lastFrameMsRef.current);
      lastFrameMsRef.current = nowMs;

      // Run physics if playing
      if (state.isPlaying) {
        accumulatorRef.current += dtMs / 1000;

        // Fixed timestep physics with catch-up limit
        let iterations = 0;
        while (accumulatorRef.current >= PHYSICS_DT && iterations < 4) {
          // Re-check isPlaying in case it changed during simulation
          const currentState = useLineriderStore.getState();
          if (!currentState.isPlaying) break;

          currentState.stepSimulation(PHYSICS_DT);
          accumulatorRef.current -= PHYSICS_DT;
          iterations++;
        }
        // Cap accumulator to prevent spiral of death
        if (accumulatorRef.current > PHYSICS_DT * 2) {
          accumulatorRef.current = PHYSICS_DT;
        }
        // Always need to render when playing (for character animations)
        needsRenderRef.current = true;
      } else {
        // Reset timing when not playing so we don't get huge dt on resume
        accumulatorRef.current = 0;
        lastFrameMsRef.current = 0;
      }

      // Get fresh state for rendering (may have changed during physics)
      state = useLineriderStore.getState();

      // Skip render if nothing changed AND we're not playing
      // (when playing, we always render for smooth character animations)
      if (!needsRenderRef.current && !state.isPlaying) {
        // Continue loop if interacting
        if (isInteractingRef.current) {
          rafRef.current = requestAnimationFrame(renderLoop);
        }
        return;
      }
      needsRenderRef.current = false;

      // Rebuild segment paths if track changed
      if (segmentPathsVersionRef.current !== state.trackVersion) {
        segmentPathsRef.current = buildSegmentPaths(state.segments);
        segmentPathsVersionRef.current = state.trackVersion;
      }

      // Clear and set up transform
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#fafafa";
      ctx.fillRect(0, 0, viewport.width, viewport.height);

      // World transform
      const cx = viewport.width / 2;
      const cy = viewport.height / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(state.camera.zoom, state.camera.zoom);
      ctx.translate(-state.camera.pos.x, -state.camera.pos.y);

      // Draw grid
      if (state.settings.isGridVisible) {
        drawGrid(ctx, state.camera, viewport);
      }

      // Draw segments
      drawSegments(
        ctx,
        state.camera.zoom,
        segmentPathsRef.current,
        strokeSegmentsRef.current,
        state.lineType
      );

      // Draw start flag
      drawStartFlag(ctx, state.camera.zoom, state.riderStart);

      // Draw rider with selected character
      const riderVelocity = getRiderVelocity(state.rider);
      drawCharacter(ctx, state.camera.zoom, state.rider, state.character, riderVelocity);

      ctx.restore();

      // Draw HUD
      const speed = len(riderVelocity);
      drawHUD(ctx, viewport, state.elapsedTime, speed, state.isPlaying);

      // Continue animation loop - always continue when playing for smooth animations
      const freshState = useLineriderStore.getState();
      if (freshState.isPlaying || isInteractingRef.current) {
        rafRef.current = requestAnimationFrame(renderLoop);
      }
    }

    function requestRender() {
      needsRenderRef.current = true;
      // Reset frame timing when starting fresh
      if (rafRef.current === null) {
        lastFrameMsRef.current = 0;
        // Prime the accumulator so physics runs on the first frame
        accumulatorRef.current = PHYSICS_DT;
        rafRef.current = requestAnimationFrame(renderLoop);
      }
    }

    // Subscribe to store changes
    const unsubscribe = useLineriderStore.subscribe(
      (s) =>
        [
          s.camera.pos.x,
          s.camera.pos.y,
          s.camera.zoom,
          s.trackVersion,
          s.isPlaying,
          s.settings.isGridVisible,
          s.rider.frame,
          s.riderStart.x,
          s.riderStart.y,
          s.character,
        ] as const,
      () => requestRender()
    );

    // Initial render
    requestRender();

    return () => {
      mounted = false;
      unsubscribe();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  // Pointer event handlers
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    function requestRender() {
      needsRenderRef.current = true;
      // The main animation loop will pick this up
    }

    function onPointerDown(e: PointerEvent) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const viewport = viewportRef.current;
      const state = useLineriderStore.getState();

      const screen = screenFromEvent(e, canvas);
      const world = screenToWorld(screen, state.camera, viewport);

      // Shift+click sets rider start position
      if (e.shiftKey) {
        state.setRiderStart(world);
        return;
      }

      canvas.setPointerCapture(e.pointerId);
      pointerIdRef.current = e.pointerId;
      isInteractingRef.current = true;
      lastScreenRef.current = screen;
      lastWorldRef.current = world;

      // Middle/right click always pans
      const isPanButton = e.button === 1 || e.button === 2;
      if (isPanButton || state.tool === "pan") {
        pointerModeRef.current = "pan";
      } else if (state.tool === "draw") {
        pointerModeRef.current = "draw";
        strokeSegmentsRef.current = [];
      } else {
        pointerModeRef.current = "erase";
        erasePointsRef.current = [world];
      }

      requestRender();
    }

    function onPointerMove(e: PointerEvent) {
      if (pointerIdRef.current !== e.pointerId) return;
      const mode = pointerModeRef.current;
      if (!mode) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const viewport = viewportRef.current;
      const state = useLineriderStore.getState();
      const screen = screenFromEvent(e, canvas);

      if (mode === "pan") {
        const deltaScreen = sub(screen, lastScreenRef.current);
        lastScreenRef.current = screen;
        state.panByScreenDelta(deltaScreen);
        return;
      }

      const world = screenToWorld(screen, state.camera, viewport);

      if (mode === "draw") {
        const deltaPx = len(sub(screen, lastScreenRef.current));
        if (deltaPx < MIN_DRAW_DIST_PX) return;

        strokeSegmentsRef.current.push({ a: lastWorldRef.current, b: world });
        lastWorldRef.current = world;
        lastScreenRef.current = screen;
        requestRender();
        return;
      }

      // Erase mode
      const minDist = 6 / state.camera.zoom;
      if (len(sub(world, lastWorldRef.current)) > minDist) {
        erasePointsRef.current.push(world);
      }
      lastWorldRef.current = world;
      lastScreenRef.current = screen;
      requestRender();
    }

    function onPointerUp(e: PointerEvent) {
      if (pointerIdRef.current !== e.pointerId) return;
      pointerIdRef.current = null;

      const canvas = canvasRef.current;
      if (canvas) {
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          // Ignore if not captured
        }
      }

      const state = useLineriderStore.getState();
      const mode = pointerModeRef.current;

      if (mode === "draw") {
        const stroke = strokeSegmentsRef.current;
        strokeSegmentsRef.current = [];
        if (stroke.length > 0) {
          state.addSegments(stroke);
        }
      } else if (mode === "erase") {
        const points = erasePointsRef.current;
        erasePointsRef.current = [];
        if (points.length > 0) {
          state.erasePath(points, 15 / state.camera.zoom);
        }
      }

      pointerModeRef.current = null;
      isInteractingRef.current = false;
      requestRender();
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const viewport = viewportRef.current;
      const rect = canvas.getBoundingClientRect();
      const cursor = v(e.clientX - rect.left, e.clientY - rect.top);

      const zoomFactor = Math.exp(-e.deltaY * 0.001);
      useLineriderStore.getState().zoomAt(cursor, viewport, zoomFactor);
    }

    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={[
        "absolute inset-0 h-full w-full touch-none",
        tool === "pan"
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-crosshair",
      ].join(" ")}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="OpenRider canvas"
      role="img"
    />
  );
}
