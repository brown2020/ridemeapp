import type { Vec2, Segment } from "./math";
import type { Camera, Viewport } from "./types";
import type { RiderState } from "./physics";
import { screenToWorld } from "./transform";
import { v, sub, normalize, add, mul, len } from "./math";

/** Line colors matching classic Line Rider */
export const LINE_COLORS = {
  normal: "#4488ff", // Blue - normal physics
  accel: "#cc2222", // Red - acceleration
  scenery: "#22aa44", // Green - decorative only
  stroke: "#111827", // Outline color
} as const;

/** Rider colors */
export const RIDER_COLORS = {
  sled: "#ffffff",
  sledOutline: "#333333",
  body: "#000000",
  scarf: "#cc2222",
  skin: "#ffd4a3",
} as const;

/**
 * Calculate grid spacing levels based on zoom
 * Returns [minorSpacing, majorSpacing] in world units
 */
export function getGridSpacings(zoom: number): [number, number] {
  // Base spacing that gives roughly 50px between minor lines
  const desiredMinorPx = 50;
  const raw = desiredMinorPx / Math.max(1e-6, zoom);

  // Snap to nice round numbers (powers of 10 * 1, 2, or 5)
  const pow10 = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow10;
  const minorStep = n < 2 ? 1 : n < 5 ? 2 : 5;
  const minorSpacing = minorStep * pow10;

  // Major lines every 5 or 10 minor lines
  const majorSpacing = minorSpacing * (minorStep === 2 ? 5 : 10);

  return [minorSpacing, majorSpacing];
}

/**
 * Draw the background grid with major and minor lines
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  viewport: Viewport
): void {
  const [minorSpacing, majorSpacing] = getGridSpacings(camera.zoom);
  const topLeft = screenToWorld(v(0, 0), camera, viewport);
  const bottomRight = screenToWorld(
    v(viewport.width, viewport.height),
    camera,
    viewport
  );

  // Calculate bounds with some padding
  const startX = Math.floor(topLeft.x / minorSpacing) * minorSpacing;
  const endX = Math.ceil(bottomRight.x / minorSpacing) * minorSpacing;
  const startY = Math.floor(topLeft.y / minorSpacing) * minorSpacing;
  const endY = Math.ceil(bottomRight.y / minorSpacing) * minorSpacing;

  // Draw minor grid lines (lighter)
  ctx.strokeStyle = "rgba(0, 0, 0, 0.04)";
  ctx.lineWidth = 1 / camera.zoom;

  ctx.beginPath();
  for (let x = startX; x <= endX; x += minorSpacing) {
    // Skip if this is a major line (we'll draw those separately)
    if (Math.abs(x % majorSpacing) < 0.001) continue;
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
  }
  for (let y = startY; y <= endY; y += minorSpacing) {
    if (Math.abs(y % majorSpacing) < 0.001) continue;
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
  }
  ctx.stroke();

  // Draw major grid lines (darker)
  const majorStartX = Math.floor(topLeft.x / majorSpacing) * majorSpacing;
  const majorEndX = Math.ceil(bottomRight.x / majorSpacing) * majorSpacing;
  const majorStartY = Math.floor(topLeft.y / majorSpacing) * majorSpacing;
  const majorEndY = Math.ceil(bottomRight.y / majorSpacing) * majorSpacing;

  ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
  ctx.lineWidth = 1 / camera.zoom;

  ctx.beginPath();
  for (let x = majorStartX; x <= majorEndX; x += majorSpacing) {
    if (Math.abs(x) < 0.001) continue; // Skip axis, drawn separately
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
  }
  for (let y = majorStartY; y <= majorEndY; y += majorSpacing) {
    if (Math.abs(y) < 0.001) continue;
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
  }
  ctx.stroke();

  // Draw axes (strongest)
  ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
  ctx.lineWidth = 1.5 / camera.zoom;

  ctx.beginPath();
  ctx.moveTo(0, startY);
  ctx.lineTo(0, endY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(startX, 0);
  ctx.lineTo(endX, 0);
  ctx.stroke();

  // Draw scale indicator in bottom-left corner
  drawScaleIndicator(ctx, camera, viewport, majorSpacing);
}

/**
 * Draw a scale indicator showing the current grid spacing
 */
function drawScaleIndicator(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  viewport: Viewport,
  majorSpacing: number
): void {
  // Draw in screen space, not world space
  ctx.save();
  ctx.resetTransform();

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  ctx.scale(dpr, dpr);

  const padding = 16;
  const barLength = majorSpacing * camera.zoom; // Length in screen pixels
  const barHeight = 4;
  const y = viewport.height - padding - 20;
  const x = padding;

  // Background
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.fillRect(x - 4, y - 16, barLength + 8, 32);

  // Scale bar
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(x, y, barLength, barHeight);

  // End caps
  ctx.fillRect(x, y - 4, 2, barHeight + 8);
  ctx.fillRect(x + barLength - 2, y - 4, 2, barHeight + 8);

  // Label
  const label = formatSpacing(majorSpacing);
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(label, x + barLength / 2, y - 4);

  ctx.restore();
}

/**
 * Format spacing value for display
 */
function formatSpacing(spacing: number): string {
  if (spacing >= 1000) {
    return `${(spacing / 1000).toFixed(spacing >= 10000 ? 0 : 1)}k`;
  }
  if (spacing >= 1) {
    return `${spacing.toFixed(0)}`;
  }
  return spacing.toFixed(1);
}

/**
 * Build a Path2D for all segments, grouped by type for efficient rendering
 */
export function buildSegmentPaths(segments: Segment[]): Map<string, Path2D> {
  const paths = new Map<string, Path2D>();

  for (const type of ["normal", "accel", "scenery"] as const) {
    paths.set(type, new Path2D());
  }

  for (const seg of segments) {
    const path = paths.get(seg.type);
    if (path) {
      path.moveTo(seg.a.x, seg.a.y);
      path.lineTo(seg.b.x, seg.b.y);
    }
  }

  return paths;
}

/**
 * Draw track segments with proper colors
 */
export function drawSegments(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  segmentPaths: Map<string, Path2D> | null,
  currentStroke: Array<Readonly<{ a: Vec2; b: Vec2 }>>,
  currentLineType: string
): void {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const baseWidth = 2.5 / zoom;

  if (segmentPaths) {
    // Draw scenery first (behind)
    const sceneryPath = segmentPaths.get("scenery");
    if (sceneryPath) {
      ctx.strokeStyle = LINE_COLORS.scenery;
      ctx.lineWidth = baseWidth * 0.8;
      ctx.stroke(sceneryPath);
    }

    // Draw normal lines
    const normalPath = segmentPaths.get("normal");
    if (normalPath) {
      ctx.strokeStyle = LINE_COLORS.normal;
      ctx.lineWidth = baseWidth;
      ctx.stroke(normalPath);
    }

    // Draw acceleration lines
    const accelPath = segmentPaths.get("accel");
    if (accelPath) {
      ctx.strokeStyle = LINE_COLORS.accel;
      ctx.lineWidth = baseWidth;
      ctx.stroke(accelPath);
    }
  }

  // Draw current stroke being drawn
  if (currentStroke.length > 0) {
    ctx.strokeStyle =
      LINE_COLORS[currentLineType as keyof typeof LINE_COLORS] ??
      LINE_COLORS.normal;
    ctx.lineWidth = baseWidth;
    ctx.beginPath();
    for (const seg of currentStroke) {
      ctx.moveTo(seg.a.x, seg.a.y);
      ctx.lineTo(seg.b.x, seg.b.y);
    }
    ctx.stroke();
  }
}

/**
 * Draw a simple ball rider (for simpler physics mode)
 */
export function drawSimpleRider(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  pos: Vec2,
  velocity: Vec2
): void {
  const radius = 10;

  // Draw motion blur trail
  const speed = len(velocity) * 60; // Approximate velocity per frame
  if (speed > 1) {
    const trailLen = Math.min(speed * 2, 50);
    const dir = normalize(velocity);
    const gradient = ctx.createLinearGradient(
      pos.x,
      pos.y,
      pos.x - dir.x * trailLen,
      pos.y - dir.y * trailLen
    );
    gradient.addColorStop(0, "rgba(239, 68, 68, 0.3)");
    gradient.addColorStop(1, "rgba(239, 68, 68, 0)");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = radius * 1.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineTo(pos.x - dir.x * trailLen, pos.y - dir.y * trailLen);
    ctx.stroke();
  }

  // Main body
  ctx.fillStyle = "#ef4444";
  ctx.strokeStyle = "#dc2626";
  ctx.lineWidth = 2 / zoom;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Face direction indicator
  if (speed > 0.5) {
    const faceDir = normalize(velocity);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(pos.x + faceDir.x * 4, pos.y + faceDir.y * 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw Bosh-style rider (simplified ragdoll)
 */
export function drawBoshRider(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  rider: RiderState
): void {
  const points = rider.points;
  if (points.length < 6) {
    // Fall back to simple rider
    drawSimpleRider(ctx, zoom, points[0]?.pos ?? v(0, 0), v(0, 0));
    return;
  }

  const sledBack = points[0].pos;
  const sledFront = points[1].pos;
  const hip = points[2].pos;
  const head = points[3].pos;
  const shoulder = points[4].pos;
  const hand = points[5].pos;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Sled
  ctx.strokeStyle = RIDER_COLORS.sledOutline;
  ctx.lineWidth = 4 / zoom;
  ctx.beginPath();
  ctx.moveTo(sledBack.x, sledBack.y);
  ctx.lineTo(sledFront.x, sledFront.y);
  ctx.stroke();

  ctx.strokeStyle = RIDER_COLORS.sled;
  ctx.lineWidth = 2.5 / zoom;
  ctx.beginPath();
  ctx.moveTo(sledBack.x, sledBack.y);
  ctx.lineTo(sledFront.x, sledFront.y);
  ctx.stroke();

  // Rope from hand to sled
  ctx.strokeStyle = "#666666";
  ctx.lineWidth = 1 / zoom;
  ctx.beginPath();
  ctx.moveTo(hand.x, hand.y);
  ctx.lineTo(sledFront.x, sledFront.y);
  ctx.stroke();

  // Body
  ctx.strokeStyle = RIDER_COLORS.body;
  ctx.lineWidth = 3 / zoom;
  ctx.beginPath();
  ctx.moveTo(hip.x, hip.y);
  ctx.lineTo(head.x, head.y);
  ctx.stroke();

  // Arm
  ctx.lineWidth = 2 / zoom;
  ctx.beginPath();
  ctx.moveTo(shoulder.x, shoulder.y);
  ctx.lineTo(hand.x, hand.y);
  ctx.stroke();

  // Leg (from hip to sled)
  ctx.beginPath();
  ctx.moveTo(hip.x, hip.y);
  const legMid = {
    x: (sledBack.x + sledFront.x) / 2,
    y: (sledBack.y + sledFront.y) / 2 - 3,
  };
  ctx.lineTo(legMid.x, legMid.y);
  ctx.stroke();

  // Scarf
  ctx.strokeStyle = RIDER_COLORS.scarf;
  ctx.lineWidth = 2 / zoom;
  const scarfEnd = add(head, mul(sub(head, shoulder), 0.8));
  ctx.beginPath();
  ctx.moveTo(head.x, head.y);
  ctx.quadraticCurveTo(head.x + 5, head.y - 5, scarfEnd.x, scarfEnd.y);
  ctx.stroke();

  // Head
  ctx.fillStyle = RIDER_COLORS.skin;
  ctx.beginPath();
  ctx.arc(head.x, head.y, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = RIDER_COLORS.body;
  ctx.beginPath();
  ctx.arc(head.x, head.y, 4, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Draw start flag marker
 */
export function drawStartFlag(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  pos: Vec2
): void {
  const poleHeight = 30;
  const flagWidth = 20;
  const flagHeight = 12;

  // Pole
  ctx.strokeStyle = "#666666";
  ctx.lineWidth = 2 / zoom;
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.lineTo(pos.x, pos.y - poleHeight);
  ctx.stroke();

  // Flag
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y - poleHeight);
  ctx.lineTo(pos.x + flagWidth, pos.y - poleHeight + flagHeight / 2);
  ctx.lineTo(pos.x, pos.y - poleHeight + flagHeight);
  ctx.closePath();
  ctx.fill();

  // "S" for start
  ctx.fillStyle = "#ffffff";
  ctx.font = `${8}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.save();
  ctx.scale(1 / zoom, 1 / zoom);
  ctx.fillText(
    "S",
    pos.x * zoom + 8,
    (pos.y - poleHeight + flagHeight / 2) * zoom
  );
  ctx.restore();
}

/**
 * Draw HUD overlay (timer, speed)
 */
export function drawHUD(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  elapsedTime: number,
  speed: number,
  isPlaying: boolean
): void {
  // Time display
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = Math.floor(elapsedTime % 60);
  const ms = Math.floor((elapsedTime % 1) * 100);
  const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;

  ctx.font = "bold 16px monospace";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";

  // Background
  const padding = 8;
  const textWidth = ctx.measureText(timeStr).width;
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.fillRect(
    viewport.width - textWidth - padding * 3,
    padding,
    textWidth + padding * 2,
    24
  );

  // Text
  ctx.fillStyle = isPlaying ? "#22c55e" : "#666666";
  ctx.fillText(timeStr, viewport.width - padding * 2, padding + 4);

  // Speed indicator
  if (isPlaying && speed > 0.1) {
    const speedStr = `${(speed * 60).toFixed(0)} u/s`;
    ctx.font = "12px monospace";
    ctx.fillStyle = "#888888";
    ctx.fillText(speedStr, viewport.width - padding * 2, padding + 28);
  }
}
