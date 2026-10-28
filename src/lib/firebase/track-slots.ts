export const MAX_USER_TRACKS = 50;

/** Document ids rules allow for newly created tracks: slot-0 … slot-49. */
export function trackSlotId(index: number): string {
  return `slot-${index}`;
}

export function isTrackSlotId(id: string): boolean {
  return /^slot-(?:[0-9]|[1-4][0-9])$/.test(id);
}

export function firstFreeTrackSlot(usedIds: Iterable<string>): string | null {
  const used = usedIds instanceof Set ? usedIds : new Set(usedIds);
  for (let index = 0; index < MAX_USER_TRACKS; index++) {
    const id = trackSlotId(index);
    if (!used.has(id)) return id;
  }
  return null;
}
