import type { Segment, Vec2 } from "@/lib/linerider/math";

export type SpatialHash = Readonly<{
  cellSize: number;
  grid: Map<string, Segment[]>;
}>;

/** One axis-aligned line across the playable world is about 5_000 cells. */
const MAX_CELLS_PER_SEGMENT = 8_000;
const MAX_HASH_INSERTIONS = 100_000;

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
function insertCell(
  grid: Map<string, Segment[]>,
  ix: number,
  iy: number,
  seg: Segment,
  inserted: { count: number }
): boolean {
  if (!Number.isFinite(ix) || !Number.isFinite(iy)) return false;
  if (inserted.count >= MAX_HASH_INSERTIONS) return false;
  const key = cellKey(ix, iy);
  const bucket = grid.get(key);
  if (bucket) {
    bucket.push(seg);
  } else {
    grid.set(key, [seg]);
  }
  inserted.count += 1;
  return true;
}

export function buildSpatialHash(
  segments: Segment[],
  cellSize: number
): SpatialHash {
  const grid = new Map<string, Segment[]>();
  const inserted = { count: 0 };

  for (const seg of segments) {
    if (inserted.count >= MAX_HASH_INSERTIONS) break;

    const minX = Math.min(seg.a.x, seg.b.x);
    const maxX = Math.max(seg.a.x, seg.b.x);
    const minY = Math.min(seg.a.y, seg.b.y);
    const maxY = Math.max(seg.a.y, seg.b.y);

    const ix0 = cellIndex(minX, cellSize);
    const ix1 = cellIndex(maxX, cellSize);
    const iy0 = cellIndex(minY, cellSize);
    const iy1 = cellIndex(maxY, cellSize);

    const spanX = ix1 - ix0 + 1;
    const spanY = iy1 - iy0 + 1;
    if (
      !Number.isFinite(spanX) ||
      !Number.isFinite(spanY) ||
      spanX <= 0 ||
      spanY <= 0
    ) {
      continue;
    }

    // A crafted diagonal can cover billions of cells. Index its ends and move on.
    if (spanX * spanY > MAX_CELLS_PER_SEGMENT) {
      insertCell(grid, ix0, iy0, seg, inserted);
      insertCell(grid, ix1, iy1, seg, inserted);
      continue;
    }

    let aborted = false;
    for (let iy = iy0; iy <= iy1 && !aborted; iy++) {
      for (let ix = ix0; ix <= ix1; ix++) {
        if (!insertCell(grid, ix, iy, seg, inserted)) {
          aborted = true;
          break;
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

