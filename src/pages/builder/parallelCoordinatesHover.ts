import type { GeneratedMolecule } from '../../vcl/types.ts';

import type { AxisLayout } from './parallelCoordinatesScales.ts';
import { valueToY } from './parallelCoordinatesScales.ts';

/** A pointer position, relative to the top left of the drawing area. */
export interface PlotPoint {
  x: number;
  y: number;
}

/** How far the pointer may sit from a polyline and still pick it, in pixels. */
export const HOVER_TOLERANCE = 6;

/**
 * Find the molecule whose polyline runs closest to the pointer. Only the
 * segment between the two axes the pointer sits between is considered, so the
 * cost is one distance per molecule whatever the number of axes.
 * @param point - Pointer position, relative to the drawing area.
 * @param molecules - Molecules that can be picked, usually the ones the brushes
 * keep.
 * @param layouts - Axes, from left to right.
 * @param innerHeight - Height of the drawing area, in pixels.
 * @returns The closest molecule within `HOVER_TOLERANCE`, or `null` when the
 * pointer is over no polyline.
 */
export function findNearestMolecule(
  point: PlotPoint,
  molecules: readonly GeneratedMolecule[],
  layouts: readonly AxisLayout[],
  innerHeight: number,
): GeneratedMolecule | null {
  const segment = findSegment(point.x, layouts);
  if (segment === null) return null;
  const { left, right } = segment;
  const width = right.x - left.x;
  if (width <= 0) return null;
  const ratio = (point.x - left.x) / width;

  let nearest: GeneratedMolecule | null = null;
  let nearestDistance = HOVER_TOLERANCE;
  for (const molecule of molecules) {
    const leftY = valueToY(molecule[left.key], left, innerHeight);
    const rightY = valueToY(molecule[right.key], right, innerHeight);
    const gap = Math.abs(leftY + (rightY - leftY) * ratio - point.y);
    // The gap is measured vertically; project it onto the normal of the
    // segment so a steep polyline is no harder to pick than a flat one.
    const distance = (gap * width) / Math.hypot(width, rightY - leftY);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = molecule;
    }
  }
  return nearest;
}

function findSegment(
  x: number,
  layouts: readonly AxisLayout[],
): { left: AxisLayout; right: AxisLayout } | null {
  const first = layouts[0];
  const last = layouts.at(-1);
  if (first === undefined || last === undefined || layouts.length < 2) {
    return null;
  }
  if (x < first.x - HOVER_TOLERANCE || x > last.x + HOVER_TOLERANCE) {
    return null;
  }
  for (let index = 1; index < layouts.length; index++) {
    const left = layouts[index - 1];
    const right = layouts[index];
    if (left === undefined || right === undefined) continue;
    if (x <= right.x || index === layouts.length - 1) return { left, right };
  }
  return null;
}
