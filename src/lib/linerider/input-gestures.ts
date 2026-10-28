/** Shift places the rider unless a straight line is already waiting for its end point. */
export function shouldPlaceRiderStart(
  shiftKey: boolean,
  linePlacing: boolean
): boolean {
  return shiftKey && !linePlacing;
}

/** Track overview uses Tab only while the canvas itself is the event target. */
export function isCanvasOverviewTarget(
  target: EventTarget | null,
  canvas: EventTarget | null
): boolean {
  return target !== null && canvas !== null && target === canvas;
}
