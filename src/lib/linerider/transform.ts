import type { Vec2 } from "@/lib/linerider/math";
import type { Camera, Viewport } from "@/lib/linerider/types";

export function worldToScreen(
  world: Vec2,
  camera: Camera,
  viewport: Viewport
): Vec2 {
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  return {
    x: (world.x - camera.pos.x) * camera.zoom + cx,
    y: (world.y - camera.pos.y) * camera.zoom + cy,
  };
}

export function screenToWorld(
  screen: Vec2,
  camera: Camera,
  viewport: Viewport
): Vec2 {
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  return {
    x: (screen.x - cx) / camera.zoom + camera.pos.x,
    y: (screen.y - cy) / camera.zoom + camera.pos.y,
  };
}
