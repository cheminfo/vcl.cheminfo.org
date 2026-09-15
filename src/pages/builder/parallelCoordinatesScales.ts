import {
  DEFAULT_COLOR_SCALE_ID,
  colorAt,
  positionInRange,
  resolveColorScale,
} from 'react-cheminfo/core';

import type { GeneratedMolecule, NumericPropertyKey } from '../../vcl/types.ts';
import { NUMERIC_PROPERTY_BY_KEY } from '../../vcl/types.ts';

/** Position and data extent of one vertical axis of the plot. */
export interface AxisLayout {
  key: NumericPropertyKey;
  label: string;
  /** Horizontal centre of the axis, in pixels. */
  x: number;
  /** Data value at the bottom of the axis. */
  min: number;
  /** Data value at the top of the axis. */
  max: number;
}

/** One labelled graduation of an axis. */
export interface AxisTick {
  value: number;
  y: number;
  text: string;
}

/** Space kept around the drawing area for the labels and the ticks. */
export const PLOT_MARGIN = { top: 26, right: 54, bottom: 22, left: 54 };

/**
 * The ramp the plot reads the coloured property with. Viridis, the family's
 * default, rather than a hue sweep: it is the one ramp that survives both a
 * greyscale print and the reader who does not separate red from green.
 */
export const PLOT_COLOR_SCALE = resolveColorScale(DEFAULT_COLOR_SCALE_ID).scale;

const DEGENERATE_PADDING = 0.5;
const TICK_COUNT = 5;

/**
 * Compute each axis' position and data extent.
 * @param molecules - Library the extents are taken from.
 * @param axes - Properties to draw, from left to right.
 * @param innerWidth - Width available between the first and the last axis.
 * @returns One layout per axis, in the order the axes were given.
 */
export function computeAxisLayouts(
  molecules: readonly GeneratedMolecule[],
  axes: readonly NumericPropertyKey[],
  innerWidth: number,
): AxisLayout[] {
  const layouts: AxisLayout[] = [];
  const count = axes.length;
  for (let index = 0; index < count; index++) {
    const key = axes[index];
    if (key === undefined) continue;
    const extent = computeExtent(molecules, key);
    layouts.push({
      key,
      label: NUMERIC_PROPERTY_BY_KEY[key].label,
      x: count === 1 ? innerWidth / 2 : (innerWidth * index) / (count - 1),
      min: extent.min,
      max: extent.max,
    });
  }
  return layouts;
}

/**
 * Map a data value to a y pixel, top of the plot being the maximum.
 * @param value - Data value.
 * @param axis - Axis the value belongs to.
 * @param innerHeight - Height of the drawing area, in pixels.
 * @returns Pixel measured from the top of the drawing area.
 */
export function valueToY(
  value: number,
  axis: AxisLayout,
  innerHeight: number,
): number {
  const span = axis.max - axis.min;
  if (span <= 0 || innerHeight <= 0) return 0;
  return ((axis.max - value) / span) * innerHeight;
}

/**
 * Map a y pixel back to a data value.
 * @param y - Pixel measured from the top of the drawing area.
 * @param axis - Axis the pixel belongs to.
 * @param innerHeight - Height of the drawing area, in pixels.
 * @returns Data value at that pixel.
 */
export function yToValue(
  y: number,
  axis: AxisLayout,
  innerHeight: number,
): number {
  if (innerHeight <= 0) return axis.max;
  return axis.max - (y / innerHeight) * (axis.max - axis.min);
}

/**
 * Colour for a value, read off the plot's ramp between the two bounds.
 * @param value - Data value to colour.
 * @param min - Value shown at the low end of the ramp.
 * @param max - Value shown at its high end.
 * @returns The colour, as `#rrggbb`.
 */
export function valueToColor(value: number, min: number, max: number): string {
  return colorAt(PLOT_COLOR_SCALE, positionInRange(value, min, max));
}

/**
 * Compute the five graduations of one axis, dropping those whose formatted
 * value repeats the previous one.
 * @param axis - Axis to graduate.
 * @param innerHeight - Height of the drawing area, in pixels.
 * @returns The ticks, from the minimum to the maximum.
 */
export function buildTicks(axis: AxisLayout, innerHeight: number): AxisTick[] {
  const { decimals } = NUMERIC_PROPERTY_BY_KEY[axis.key];
  const ticks: AxisTick[] = [];
  for (let index = 0; index < TICK_COUNT; index++) {
    const value = axis.min + ((axis.max - axis.min) * index) / (TICK_COUNT - 1);
    const text = value.toFixed(decimals);
    if (ticks.at(-1)?.text === text) continue;
    ticks.push({ value, y: valueToY(value, axis, innerHeight), text });
  }
  return ticks;
}

function computeExtent(
  molecules: readonly GeneratedMolecule[],
  key: NumericPropertyKey,
): { min: number; max: number } {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const molecule of molecules) {
    const value = molecule[key];
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (min > max) return { min: -DEGENERATE_PADDING, max: DEGENERATE_PADDING };
  if (min === max) {
    return { min: min - DEGENERATE_PADDING, max: max + DEGENERATE_PADDING };
  }
  return { min, max };
}
