import type { BrushBehavior, D3BrushEvent } from 'd3-brush';
import { brushY } from 'd3-brush';
import { select } from 'd3-selection';

import type { NumericPropertyKey, Range } from '../../vcl/types.ts';

import type { AxisLayout } from './parallelCoordinatesScales.ts';
import { yToValue } from './parallelCoordinatesScales.ts';

/** Called with the interval an axis brush keeps, or `null` when it is cleared. */
export type RangeChange = (
  key: NumericPropertyKey,
  range: Range | null,
) => void;

const BRUSH_HALF_WIDTH = 9;

/**
 * Build the vertical brush of one axis. The handler reports the brushed
 * interval in data units, low value first.
 * @param layout - Axis the brush belongs to.
 * @param innerHeight - Height of the plotting area, in pixels.
 * @param onRange - Called with the brushed interval, or `null` when cleared.
 * @returns The brush behaviour, not yet attached to any element.
 */
export function createAxisBrush(
  layout: AxisLayout,
  innerHeight: number,
  onRange: RangeChange,
): BrushBehavior<unknown> {
  return brushY<unknown>()
    .extent([
      [-BRUSH_HALF_WIDTH, 0],
      [BRUSH_HALF_WIDTH, innerHeight],
    ])
    .on('end', (event: D3BrushEvent<unknown>) => {
      // A programmatic `brush.move` has no source event; reacting to it would
      // feed the incoming range straight back to the caller.
      const source: unknown = event.sourceEvent;
      if (source === null || source === undefined) return;
      const selection = event.selection;
      if (selection === null) {
        onRange(layout.key, null);
        return;
      }
      const top = selection[0];
      const bottom = selection[1];
      if (typeof top !== 'number' || typeof bottom !== 'number') return;
      onRange(layout.key, [
        yToValue(bottom, layout, innerHeight),
        yToValue(top, layout, innerHeight),
      ]);
    });
}

/**
 * Release everything `createAxisBrush` and its attachment allocated: the event
 * handler, the listeners d3 installed on the element, and the brush overlay.
 * @param element - Group the brush was attached to.
 * @param behavior - Brush behaviour returned by `createAxisBrush`.
 */
export function detachAxisBrush(
  element: SVGGElement,
  behavior: BrushBehavior<unknown>,
): void {
  behavior.on('end', null);
  select(element).on('.brush', null).selectAll('*').remove();
}
