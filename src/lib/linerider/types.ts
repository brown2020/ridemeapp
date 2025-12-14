import type { Vec2 } from "@/lib/linerider/math";

export type Camera = Readonly<{
  pos: Vec2; // world coordinate at screen center
  zoom: number; // pixels per world unit
}>;

export type Viewport = Readonly<{ width: number; height: number }>;
