import { NonIdealState, Tooltip } from '@blueprintjs/core';
import type { BrushBehavior } from 'd3-brush';
import { select } from 'd3-selection';
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  ReactElement,
} from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MF } from 'react-mf';

import { helpTooltip } from '../../components/shared/helpContent.tsx';
import type {
  GeneratedMolecule,
  NumericPropertyKey,
  Range,
} from '../../vcl/types.ts';
import { NUMERIC_PROPERTY_BY_KEY } from '../../vcl/types.ts';

import {
  createAxisBrush,
  detachAxisBrush,
} from './parallelCoordinatesBrush.ts';
import type { Highlight } from './parallelCoordinatesDraw.ts';
import {
  HOVER_COLOR,
  SELECTION_COLOR,
  drawHighlights,
  drawPolylines,
} from './parallelCoordinatesDraw.ts';
import { findNearestMolecule } from './parallelCoordinatesHover.ts';
import type { AxisLayout } from './parallelCoordinatesScales.ts';
import {
  PLOT_MARGIN,
  buildTicks,
  computeAxisLayouts,
  valueToY,
} from './parallelCoordinatesScales.ts';
import { propertyHelp } from './tooltips.ts';

const AXIS_DETAIL = 'Drag along the axis to keep only that range';

export interface ParallelCoordinatesProps {
  molecules: readonly GeneratedMolecule[];
  filtered: readonly GeneratedMolecule[];
  axes: readonly NumericPropertyKey[];
  colorBy: NumericPropertyKey;
  ranges: Partial<Record<NumericPropertyKey, Range>>;
  onRangeChange: (key: NumericPropertyKey, range: Range | null) => void;
  /** Molecule the pointer is over, wherever it is hovered from. */
  highlightedIdCode: string | null;
  /** Molecule selected in the table. */
  selectedIdCode: string | null;
  /** Called with the molecule the pointer is over in the plot, or `null`. */
  onHover: (idCode: string | null) => void;
  /** Plot height in pixels, axis labels included. @default 320 */
  height?: number;
}

const DEFAULT_WIDTH = 900;
// Written as a declaration rather than a presentation attribute: `var()` is
// resolved in CSS, and an SVG attribute is not CSS.
const AXIS_COLOR = 'var(--text-muted, #5b6875)';
const TOOLTIP_OFFSET = 14;
const TOOLTIP_WIDTH = 150;
const OVERLAY: CSSProperties = { position: 'absolute', inset: 0 };

/**
 * Brushable parallel coordinates plot of a library: one vertical axis per
 * numeric property, one canvas polyline per molecule, and a vertical brush on
 * every axis filtering the library. The molecule under the pointer is drawn on
 * top of the others and reported to the caller, which highlights it in the
 * table.
 * @param props - Library to draw, the brushes currently applied to it and the
 * molecules singled out in the table.
 * @returns The plot, or a non ideal state while the library is empty.
 */
export function ParallelCoordinates(props: ParallelCoordinatesProps) {
  const {
    molecules,
    filtered,
    axes,
    colorBy,
    ranges,
    onRangeChange,
    highlightedIdCode,
    selectedIdCode,
    onHover,
    height = 320,
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const highlightCanvasRef = useRef<HTMLCanvasElement>(null);
  const groupsRef = useRef(new Map<NumericPropertyKey, SVGGElement>());
  const brushesRef = useRef(
    new Map<NumericPropertyKey, BrushBehavior<unknown>>(),
  );
  const rangeChangeRef = useRef(onRangeChange);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const innerWidth = Math.max(width - PLOT_MARGIN.left - PLOT_MARGIN.right, 10);
  const innerHeight = Math.max(
    height - PLOT_MARGIN.top - PLOT_MARGIN.bottom,
    10,
  );
  const layouts = useMemo(
    () => computeAxisLayouts(molecules, axes, innerWidth),
    [molecules, axes, innerWidth],
  );
  const colorAxis = useMemo(
    () => computeAxisLayouts(molecules, [colorBy], 0)[0],
    [molecules, colorBy],
  );
  const moleculesByIdCode = useMemo(() => {
    const byIdCode = new Map<string, GeneratedMolecule>();
    for (const molecule of molecules) byIdCode.set(molecule.idCode, molecule);
    return byIdCode;
  }, [molecules]);
  const highlights = useMemo(
    () => buildHighlights(moleculesByIdCode, selectedIdCode, highlightedIdCode),
    [moleculesByIdCode, selectedIdCode, highlightedIdCode],
  );

  useEffect(() => {
    rangeChangeRef.current = onRangeChange;
  }, [onRangeChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) setWidth(entry.contentRect.width);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const context = prepareCanvas(canvasRef.current, width, height);
    if (context === null || colorAxis === undefined) return;
    drawPolylines(context, {
      molecules,
      filtered,
      layouts,
      colorAxis,
      colorBy,
      innerHeight,
    });
  }, [
    molecules,
    filtered,
    layouts,
    colorAxis,
    colorBy,
    width,
    height,
    innerHeight,
  ]);

  useEffect(() => {
    const context = prepareCanvas(highlightCanvasRef.current, width, height);
    if (context === null) return;
    drawHighlights(context, highlights, layouts, innerHeight);
  }, [highlights, layouts, width, height, innerHeight]);

  useEffect(() => {
    const brushes = brushesRef.current;
    const groups = groupsRef.current;
    const attached: Array<{
      key: NumericPropertyKey;
      element: SVGGElement;
      behavior: BrushBehavior<unknown>;
    }> = [];

    for (const layout of layouts) {
      const element = groups.get(layout.key);
      if (element === undefined) continue;
      const behavior = createAxisBrush(layout, innerHeight, (key, range) => {
        rangeChangeRef.current(key, range);
      });
      select(element).call(behavior);
      brushes.set(layout.key, behavior);
      attached.push({ key: layout.key, element, behavior });
    }

    return () => {
      for (const { key, element, behavior } of attached) {
        detachAxisBrush(element, behavior);
        brushes.delete(key);
      }
    };
  }, [layouts, innerHeight]);

  useEffect(() => {
    for (const layout of layouts) {
      const element = groupsRef.current.get(layout.key);
      const behavior = brushesRef.current.get(layout.key);
      if (element === undefined || behavior === undefined) continue;
      const range = ranges[layout.key];
      behavior.move(
        select(element),
        range === undefined
          ? null
          : [
              valueToY(range[1], layout, innerHeight),
              valueToY(range[0], layout, innerHeight),
            ],
      );
    }
  }, [layouts, ranges, innerHeight]);

  function handleMouseMove(event: ReactMouseEvent<HTMLDivElement>): void {
    const container = containerRef.current;
    if (container === null) return;
    const bounds = container.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const molecule = findNearestMolecule(
      { x: x - PLOT_MARGIN.left, y: y - PLOT_MARGIN.top },
      filtered,
      layouts,
      innerHeight,
    );
    onHover(molecule === null ? null : molecule.idCode);
    setTooltip(molecule === null ? null : { molecule, x, y });
  }

  function handleMouseLeave(): void {
    onHover(null);
    setTooltip(null);
  }

  if (molecules.length === 0) {
    return (
      <div ref={containerRef} className="parallel-coordinates">
        <NonIdealState
          icon="scatter-plot"
          description="Generate a library to see its property distribution."
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="parallel-coordinates"
      style={{ position: 'relative', height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        className="parallel-coordinates-canvas"
        style={{ ...OVERLAY, width: '100%', height }}
      />
      <canvas
        ref={highlightCanvasRef}
        className="parallel-coordinates-canvas"
        style={{ ...OVERLAY, width: '100%', height }}
      />
      <svg
        className="parallel-coordinates-axes"
        width={width}
        height={height}
        style={OVERLAY}
      >
        <g
          transform={`translate(${PLOT_MARGIN.left},${PLOT_MARGIN.top})`}
          fontSize={9}
          style={{ fill: AXIS_COLOR }}
          textAnchor="middle"
        >
          {layouts.map((layout) => (
            <g
              key={layout.key}
              className="parallel-coordinates-axis"
              transform={`translate(${layout.x},0)`}
            >
              <line y2={innerHeight} style={{ stroke: AXIS_COLOR }} />
              {buildTicks(layout, innerHeight).map((tick) => (
                <g key={tick.value} transform={`translate(0,${tick.y})`}>
                  <line x1={-4} style={{ stroke: AXIS_COLOR }} />
                  <text x={-7} dy="0.32em" textAnchor="end">
                    {tick.text}
                  </text>
                </g>
              ))}
              <g
                ref={(element) => {
                  if (element === null) groupsRef.current.delete(layout.key);
                  else groupsRef.current.set(layout.key, element);
                }}
              />
            </g>
          ))}
        </g>
      </svg>
      {/* The axis labels are HTML, not SVG text, so each one carries the
          tooltip explaining the property it draws. */}
      <div className="parallel-coordinates-labels" style={OVERLAY}>
        {layouts.map((layout) => (
          <AxisLabel key={layout.key} layout={layout} />
        ))}
      </div>
      {tooltip === null ? null : (
        <div
          className="parallel-coordinates-tooltip"
          style={{
            left: Math.min(tooltip.x + TOOLTIP_OFFSET, width - TOOLTIP_WIDTH),
            top: tooltip.y + TOOLTIP_OFFSET,
          }}
        >
          <MF mf={tooltip.molecule.mf} />
          <span>
            {NUMERIC_PROPERTY_BY_KEY[colorBy].label}{' '}
            {tooltip.molecule[colorBy].toFixed(
              NUMERIC_PROPERTY_BY_KEY[colorBy].decimals,
            )}
          </span>
        </div>
      )}
    </div>
  );
}

interface TooltipState {
  molecule: GeneratedMolecule;
  /** Pointer position, relative to the top left of the plot. */
  x: number;
  y: number;
}

/**
 * The name of one axis, centred over it, explaining the property it draws.
 * `renderTarget` puts the tooltip on the label itself: the wrapper Blueprint
 * would otherwise add is a zero sized box at the origin of the overlay, and
 * every tooltip would open there instead of over its own axis.
 * @param props - Axis to label.
 * @returns The label and its tooltip.
 */
function AxisLabel(props: { layout: AxisLayout }): ReactElement {
  const { layout } = props;
  return (
    <Tooltip
      {...helpTooltip(propertyHelp(layout.key, [AXIS_DETAIL]))}
      placement="bottom"
      renderTarget={({ isOpen, className, ...targetProps }) => (
        <span
          {...targetProps}
          className={`parallel-coordinates-label ${className}`}
          style={{ left: PLOT_MARGIN.left + layout.x }}
        >
          {layout.label}
        </span>
      )}
    />
  );
}

/**
 * Resize a canvas to the device pixel grid and move its origin to the drawing
 * area, which also clears whatever it held.
 * @param canvas - Canvas to prepare, or `null` before it is mounted.
 * @param width - Width of the plot, in CSS pixels.
 * @param height - Height of the plot, in CSS pixels.
 * @returns The context, or `null` when there is nothing to draw on.
 */
function prepareCanvas(
  canvas: HTMLCanvasElement | null,
  width: number,
  height: number,
): CanvasRenderingContext2D | null {
  if (canvas === null) return null;
  const context = canvas.getContext('2d');
  if (context === null) return null;
  const pixelRatio = Math.max(window.devicePixelRatio, 1);
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.resetTransform();
  context.scale(pixelRatio, pixelRatio);
  context.translate(PLOT_MARGIN.left, PLOT_MARGIN.top);
  return context;
}

function buildHighlights(
  moleculesByIdCode: ReadonlyMap<string, GeneratedMolecule>,
  selectedIdCode: string | null,
  highlightedIdCode: string | null,
): Highlight[] {
  const highlights: Highlight[] = [];
  const selected =
    selectedIdCode === null ? undefined : moleculesByIdCode.get(selectedIdCode);
  if (selected !== undefined && selectedIdCode !== highlightedIdCode) {
    highlights.push({ molecule: selected, color: SELECTION_COLOR });
  }
  const hovered =
    highlightedIdCode === null
      ? undefined
      : moleculesByIdCode.get(highlightedIdCode);
  if (hovered !== undefined) {
    highlights.push({ molecule: hovered, color: HOVER_COLOR });
  }
  return highlights;
}
