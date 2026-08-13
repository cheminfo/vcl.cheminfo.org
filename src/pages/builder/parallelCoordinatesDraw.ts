import type { GeneratedMolecule, NumericPropertyKey } from '../../vcl/types.ts';

import type { AxisLayout } from './parallelCoordinatesScales.ts';
import { valueToColor, valueToY } from './parallelCoordinatesScales.ts';

/** Everything the canvas pass needs, besides the drawing context. */
export interface DrawOptions {
  molecules: readonly GeneratedMolecule[];
  filtered: readonly GeneratedMolecule[];
  layouts: readonly AxisLayout[];
  /** Axis whose extent drives the colour scale. */
  colorAxis: AxisLayout;
  colorBy: NumericPropertyKey;
  innerHeight: number;
}

/** One molecule drawn on top of the plot, and the colour it is drawn with. */
export interface Highlight {
  molecule: GeneratedMolecule;
  color: string;
}

/** Colour of the molecule the pointer is over, in the plot or in the table. */
export const HOVER_COLOR = '#1c2127';
/** Colour of the molecule selected in the table. */
export const SELECTION_COLOR = '#2d72d2';

const PALETTE_STEPS = 120;
// Overlapping segments of one stroked path accumulate alpha, so a translucent
// black saturates to black wherever the library is dense. A light grey keeps
// the excluded molecules behind the selection however many of them pile up:
// compositing can only ever converge on this colour.
const EXCLUDED_COLOR = 'rgba(171, 179, 191, 0.16)';
const INCLUDED_ALPHA = 0.35;
const PALETTE: readonly string[] = buildPalette();
// A halo under the highlighted polyline, so it reads against the dense mass of
// the library whatever colour that mass has at this point.
const HALO_COLOR = 'rgba(255, 255, 255, 0.85)';
const HALO_WIDTH = 5;
const HIGHLIGHT_WIDTH = 2;
const HIGHLIGHT_DOT_RADIUS = 3;
const FULL_TURN = 2 * Math.PI;

/**
 * Draw one polyline per molecule: the excluded ones in a light grey underneath,
 * the kept ones coloured by the property the user selected.
 * @param context - Context of a canvas already scaled and translated to the
 * drawing area.
 * @param options - Library, axes and colour scale to draw.
 */
export function drawPolylines(
  context: CanvasRenderingContext2D,
  options: DrawOptions,
): void {
  const { molecules, filtered, layouts, colorAxis, colorBy, innerHeight } =
    options;
  if (layouts.length < 2) return;
  const everyMoleculeKept = filtered.length === molecules.length;
  const included = new Set<string>();
  context.lineWidth = 1;

  if (!everyMoleculeKept) {
    for (const molecule of filtered) included.add(molecule.idCode);
    context.strokeStyle = EXCLUDED_COLOR;
    context.beginPath();
    for (const molecule of molecules) {
      if (included.has(molecule.idCode)) continue;
      tracePolyline(context, molecule, layouts, innerHeight);
    }
    context.stroke();
  }

  const span = colorAxis.max - colorAxis.min;
  context.globalAlpha = INCLUDED_ALPHA;
  let previousStep = -1;
  for (const molecule of molecules) {
    if (!everyMoleculeKept && !included.has(molecule.idCode)) continue;
    const step = colorStep(molecule[colorBy], colorAxis.min, span);
    if (step !== previousStep) {
      const color = PALETTE[step];
      if (color !== undefined) context.strokeStyle = color;
      previousStep = step;
    }
    context.beginPath();
    tracePolyline(context, molecule, layouts, innerHeight);
    context.stroke();
  }
  context.globalAlpha = 1;
}

/**
 * Draw the polylines of a few singled out molecules, each over a white halo and
 * dotted at every axis crossing.
 * @param context - Context of a canvas already scaled and translated to the
 * drawing area.
 * @param highlights - Molecules to draw, the last one on top.
 * @param layouts - Axes, from left to right.
 * @param innerHeight - Height of the drawing area, in pixels.
 */
export function drawHighlights(
  context: CanvasRenderingContext2D,
  highlights: readonly Highlight[],
  layouts: readonly AxisLayout[],
  innerHeight: number,
): void {
  if (layouts.length < 2) return;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  for (const { molecule, color } of highlights) {
    context.beginPath();
    tracePolyline(context, molecule, layouts, innerHeight);
    context.strokeStyle = HALO_COLOR;
    context.lineWidth = HALO_WIDTH;
    context.stroke();
    context.strokeStyle = color;
    context.lineWidth = HIGHLIGHT_WIDTH;
    context.stroke();

    context.fillStyle = color;
    for (const layout of layouts) {
      const y = valueToY(molecule[layout.key], layout, innerHeight);
      context.beginPath();
      context.arc(layout.x, y, HIGHLIGHT_DOT_RADIUS, 0, FULL_TURN);
      context.fill();
    }
  }
}

/**
 * Add the polyline of one molecule to the current path.
 * @param context - Context of a canvas already scaled and translated to the
 * drawing area.
 * @param molecule - Molecule to trace.
 * @param layouts - Axes, from left to right.
 * @param innerHeight - Height of the drawing area, in pixels.
 */
export function tracePolyline(
  context: CanvasRenderingContext2D,
  molecule: GeneratedMolecule,
  layouts: readonly AxisLayout[],
  innerHeight: number,
): void {
  let started = false;
  for (const layout of layouts) {
    const y = valueToY(molecule[layout.key], layout, innerHeight);
    if (started) {
      context.lineTo(layout.x, y);
    } else {
      context.moveTo(layout.x, y);
      started = true;
    }
  }
}

function colorStep(value: number, min: number, span: number): number {
  if (span <= 0) return 0;
  const ratio = (value - min) / span;
  if (Number.isNaN(ratio) || ratio < 0) return 0;
  if (ratio > 1) return PALETTE_STEPS;
  return Math.round(ratio * PALETTE_STEPS);
}

function buildPalette(): string[] {
  const palette: string[] = [];
  for (let step = 0; step <= PALETTE_STEPS; step++) {
    palette.push(valueToColor(step, 0, PALETTE_STEPS));
  }
  return palette;
}
