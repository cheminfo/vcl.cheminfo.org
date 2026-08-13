import {
  Card,
  Checkbox,
  Classes,
  H5,
  HTMLSelect,
  PopoverNext,
} from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ChangeEvent, ReactElement } from 'react';
import { Button } from 'react-science/ui';

import { HelpIcon } from '../../components/shared/HelpIcon.tsx';
import { HelpTooltip } from '../../components/shared/HelpTooltip.tsx';
import { helpTooltip } from '../../components/shared/helpContent.tsx';
import { data, filteredMolecules } from '../../state/data.ts';
import {
  preferences,
  setColorBy,
  toggleColumn,
} from '../../state/preferences.ts';
import {
  clearBrushRanges,
  hoverMoleculeInPlot,
  setBrushRange,
  view,
} from '../../state/view.ts';
import type { NumericPropertyKey, Range } from '../../vcl/types.ts';
import { NUMERIC_PROPERTIES } from '../../vcl/types.ts';

import { DownloadBar } from './DownloadBar.tsx';
import { MoleculeTable } from './MoleculeTable.tsx';
import { ParallelCoordinates } from './ParallelCoordinates.tsx';
import {
  RESULTS_CLEAR_FILTERS_HELP,
  RESULTS_COLOUR_BY_HELP,
  RESULTS_COLUMNS_HELP,
  RESULTS_PANEL_HELP,
  propertyHelp,
  selectionHelp,
} from './tooltips.ts';

/**
 * The enumerated library: a brushable parallel coordinates plot over every
 * predicted property, the downloads and the table of the current selection.
 * @returns The results card of the builder page.
 */
export function ResultsPanel(): ReactElement {
  useSignals();

  const molecules = data.molecules.value;
  const filtered = filteredMolecules.value;
  const ranges = view.brushRanges.value;
  const axes = preferences.results.axes.value;
  const colorBy = preferences.results.colorBy.value;
  const columns = preferences.results.columns.value;
  const brushed = hasAnyBrush(ranges);
  const highlightedIdCode =
    view.tableHoverIdCode.value ?? view.plotHoverIdCode.value;

  return (
    <Card className="results-panel">
      <div className="panel-heading">
        <H5>
          <span className="help-label">
            4. Library
            <HelpIcon help={RESULTS_PANEL_HELP} />
          </span>
        </H5>
      </div>

      <div className="results-toolbar">
        <HelpTooltip help={selectionHelp(filtered.length, molecules.length)}>
          <span className="results-count">{molecules.length} molecules</span>
        </HelpTooltip>
        {brushed ? (
          <>
            <HelpTooltip
              help={selectionHelp(filtered.length, molecules.length)}
            >
              <span className={Classes.TEXT_MUTED}>
                {filtered.length} of {molecules.length} selected
              </span>
            </HelpTooltip>
            <Button
              variant="minimal"
              icon="filter-remove"
              text="Clear filters"
              tooltipProps={helpTooltip(RESULTS_CLEAR_FILTERS_HELP)}
              onClick={clearBrushRanges}
            />
          </>
        ) : null}

        <span className="results-toolbar-gap" />

        <span className={`help-label ${Classes.TEXT_MUTED}`}>
          Colour by
          <HelpIcon help={RESULTS_COLOUR_BY_HELP} />
        </span>
        <HTMLSelect
          value={colorBy}
          options={COLOUR_OPTIONS}
          onChange={handleColorChange}
        />
        <PopoverNext
          placement="bottom-end"
          content={
            <div className="column-picker">
              {NUMERIC_PROPERTIES.map((property) => (
                <HelpTooltip
                  key={property.key}
                  help={propertyHelp(property.key)}
                  placement="left"
                >
                  <Checkbox
                    checked={columns.includes(property.key)}
                    label={property.label}
                    onChange={() => {
                      toggleColumn(property.key);
                    }}
                  />
                </HelpTooltip>
              ))}
            </div>
          }
        >
          <Button
            variant="minimal"
            icon="list-columns"
            endIcon="caret-down"
            text={`Columns (${columns.length})`}
            tooltipProps={helpTooltip(RESULTS_COLUMNS_HELP)}
          />
        </PopoverNext>
      </div>

      <ParallelCoordinates
        molecules={molecules}
        filtered={filtered}
        axes={axes}
        colorBy={colorBy}
        ranges={ranges}
        onRangeChange={setBrushRange}
        highlightedIdCode={highlightedIdCode}
        selectedIdCode={view.selectedIdCode.value}
        onHover={hoverMoleculeInPlot}
      />

      <DownloadBar />
      <MoleculeTable />
    </Card>
  );
}

const COLOUR_OPTIONS = NUMERIC_PROPERTIES.map((property) => ({
  value: property.key,
  label: property.label,
}));

function handleColorChange(event: ChangeEvent<HTMLSelectElement>): void {
  const key = toPropertyKey(event.currentTarget.value);
  if (key !== null) setColorBy(key);
}

function hasAnyBrush(
  ranges: Partial<Record<NumericPropertyKey, Range>>,
): boolean {
  for (const property of NUMERIC_PROPERTIES) {
    if (ranges[property.key] !== undefined) return true;
  }
  return false;
}

function toPropertyKey(value: string): NumericPropertyKey | null {
  for (const property of NUMERIC_PROPERTIES) {
    if (property.key === value) return property.key;
  }
  return null;
}
