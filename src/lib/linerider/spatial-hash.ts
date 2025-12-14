import type { Segment, Vec2 } from "@/lib/linerider/math";

export type SpatialHash = Readonly<{
  cellSize: number;
  grid: Map<string, Segment[]>;
}>;

function cellKey(ix: number, iy: number): string {
  return `${ix},${iy}`;
}

function cellIndex(n: number, cellSize: number): number {
  return Math.floor(n / cellSize);
}

/**
 * Improved spatial index that handles segment coverage properly.
 *
 * Instead of just using the midpoint (which misses long segments),
 * we insert segments into ALL cells they intersect.
 */
export function buildSpatialHash(
  segments: Segment[],
  cellSize: number
): SpatialHash {
  const grid = new Map<string, Segment[]>();

  for (const seg of segments) {
    // Get bounding box of segment
    const minX = Math.min(seg.a.x, seg.b.x);
    const maxX = Math.max(seg.a.x, seg.b.x);
    const minY = Math.min(seg.a.y, seg.b.y);
    const maxY = Math.max(seg.a.y, seg.b.y);

    // Get all cells the segment spans
    const ix0 = cellIndex(minX, cellSize);
    const ix1 = cellIndex(maxX, cellSize);
    const iy0 = cellIndex(minY, cellSize);
    const iy1 = cellIndex(maxY, cellSize);

    // Insert into all overlapping cells
    for (let iy = iy0; iy <= iy1; iy++) {
      for (let ix = ix0; ix <= ix1; ix++) {
        const key = cellKey(ix, iy);
        const bucket = grid.get(key);
        if (bucket) {
          bucket.push(seg);
        } else {
          grid.set(key, [seg]);
        }
      }
    }
  }

  return { cellSize, grid };
}

/**
 * Query segments near a point within a given radius.
 * Returns segments from all cells that could contain matches.
 */
export function querySpatialHash(
  hash: SpatialHash,
  p: Vec2,
  radiusWorld: number
): Segment[] {
  const { cellSize, grid } = hash;
  const ix0 = cellIndex(p.x - radiusWorld, cellSize);
  const ix1 = cellIndex(p.x + radiusWorld, cellSize);
  const iy0 = cellIndex(p.y - radiusWorld, cellSize);
  const iy1 = cellIndex(p.y + radiusWorld, cellSize);

  // Use a Set to deduplicate segments that appear in multiple cells
  const seen = new Set<string>();
  const out: Segment[] = [];

  for (let iy = iy0; iy <= iy1; iy++) {
    for (let ix = ix0; ix <= ix1; ix++) {
      const bucket = grid.get(cellKey(ix, iy));
      if (!bucket) continue;

      for (const seg of bucket) {
        if (!seen.has(seg.id)) {
          seen.add(seg.id);
          out.push(seg);
        }
      }
    }
  }

  return out;
}

/**
 * Query all segments that intersect a rectangular region
 */
export function querySpatialHashRect(
  hash: SpatialHash,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): Segment[] {
  const { cellSize, grid } = hash;
  const ix0 = cellIndex(minX, cellSize);
  const ix1 = cellIndex(maxX, cellSize);
  const iy0 = cellIndex(minY, cellSize);
  const iy1 = cellIndex(maxY, cellSize);

  const seen = new Set<string>();
  const out: Segment[] = [];

  for (let iy = iy0; iy <= iy1; iy++) {
    for (let ix = ix0; ix <= ix1; ix++) {
      const bucket = grid.get(cellKey(ix, iy));
      if (!bucket) continue;

      for (const seg of bucket) {
        if (!seen.has(seg.id)) {
          seen.add(seg.id);
          out.push(seg);
        }
      }
    }
  }

  return out;
}
