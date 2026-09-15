import { Classes, Icon, NonIdealState } from '@blueprintjs/core';
import type { IconName } from '@blueprintjs/icons';
import { useSignals } from '@preact/signals-react/runtime';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { CSSProperties, ReactElement } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Structure } from 'react-cheminfo/structure';
import { MF } from 'react-mf';

import { HelpTooltip } from '../../components/shared/HelpTooltip.tsx';
import { filteredMolecules } from '../../state/data.ts';
import { preferences } from '../../state/preferences.ts';
import {
  hoverMoleculeInTable,
  selectMolecule,
  view,
} from '../../state/view.ts';
import type { GeneratedMolecule, NumericPropertyKey } from '../../vcl/types.ts';
import { NUMERIC_PROPERTY_BY_KEY } from '../../vcl/types.ts';

import {
  TABLE_FORMULA_HELP,
  TABLE_INDEX_HELP,
  TABLE_STRUCTURE_HELP,
  propertyHelp,
} from './tooltips.ts';

/**
 * The selected molecules as a virtualized table: structure, formula and the
 * numeric properties chosen in the column picker. Clicking a numeric header
 * cycles the sort ascending, descending, then off.
 * @returns The table, or a non-ideal state when nothing is selected.
 */
export function MoleculeTable(): ReactElement {
  useSignals();

  const molecules = filteredMolecules.value;
  const columns = preferences.results.columns.value;
  const selectedIdCode = view.selectedIdCode.value;
  // Only the hover coming from the plot is read here: the pointer inside the
  // table already highlights its own row through `:hover`.
  const plotHoverIdCode = view.plotHoverIdCode.value;

  const [sort, setSort] = useState<SortState>({ key: null, direction: 'asc' });
  const scrollRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => sortMolecules(molecules, sort), [molecules, sort]);
  const indexByIdCode = useMemo(() => {
    const byIdCode = new Map<string, number>();
    for (let index = 0; index < rows.length; index++) {
      const molecule = rows[index];
      if (molecule !== undefined) byIdCode.set(molecule.idCode, index);
    }
    return byIdCode;
  }, [rows]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  useEffect(() => {
    if (plotHoverIdCode === null) return;
    const index = indexByIdCode.get(plotHoverIdCode);
    if (index !== undefined) {
      virtualizer.scrollToIndex(index, { align: 'auto' });
    }
  }, [plotHoverIdCode, indexByIdCode, virtualizer]);

  const gridTemplateColumns = `56px 190px 150px repeat(${columns.length}, minmax(84px, 1fr))`;

  if (rows.length === 0) {
    return (
      <NonIdealState
        icon="th-list"
        title="No molecules"
        description="Generate the library, or widen the brushes of the plot above."
      />
    );
  }

  return (
    <div ref={scrollRef} className="results-table molecule-table">
      <div
        className="molecule-table-header"
        style={{ ...HEADER_GEOMETRY, gridTemplateColumns }}
      >
        <HelpTooltip help={TABLE_INDEX_HELP} placement="bottom-start">
          <span>#</span>
        </HelpTooltip>
        <HelpTooltip help={TABLE_STRUCTURE_HELP} placement="bottom-start">
          <span>Structure</span>
        </HelpTooltip>
        <HelpTooltip help={TABLE_FORMULA_HELP} placement="bottom-start">
          <span>Formula</span>
        </HelpTooltip>
        {columns.map((key) => (
          <HelpTooltip
            key={key}
            help={propertyHelp(key, [sortDetail(sort, key)])}
            placement="bottom"
          >
            <button
              type="button"
              className="molecule-table-sort"
              onClick={() => {
                setSort((current) => cycleSort(current, key));
              }}
            >
              {NUMERIC_PROPERTY_BY_KEY[key].label}
              <Icon icon={getSortIcon(sort, key)} size={12} />
            </button>
          </HelpTooltip>
        ))}
      </div>

      <div
        className="molecule-table-body"
        style={{ position: 'relative', height: virtualizer.getTotalSize() }}
        onMouseLeave={() => {
          hoverMoleculeInTable(null);
        }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const molecule = rows[item.index];
          if (molecule === undefined) return null;
          return (
            <button
              key={item.key}
              type="button"
              className="molecule-row"
              data-selected={
                molecule.idCode === selectedIdCode ? 'true' : undefined
              }
              data-highlighted={
                molecule.idCode === plotHoverIdCode ? 'true' : undefined
              }
              style={{
                ...ROW_GEOMETRY,
                gridTemplateColumns,
                height: item.size,
                transform: `translateY(${item.start}px)`,
              }}
              onClick={() => {
                selectMolecule(molecule.idCode);
              }}
              onMouseEnter={() => {
                hoverMoleculeInTable(molecule.idCode);
              }}
            >
              <span className={Classes.TEXT_MUTED}>{item.index + 1}</span>
              <Structure idCode={molecule.idCode} width={180} height={80} />
              <MF mf={molecule.mf} />
              {columns.map((key) => (
                <span key={key} className="molecule-cell-number">
                  {molecule[key].toFixed(NUMERIC_PROPERTY_BY_KEY[key].decimals)}
                </span>
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const ROW_HEIGHT = 96;

// The virtualizer positions the rows itself, so their geometry cannot live in
// the stylesheet; the grid tracks follow the visible columns and are as dynamic.
const HEADER_GEOMETRY: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
  display: 'grid',
  alignItems: 'center',
  background: '#fff',
};

const ROW_GEOMETRY: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  display: 'grid',
  alignItems: 'center',
};

type SortDirection = 'asc' | 'desc';

interface SortState {
  /** Property the table is sorted by, or `null` when it keeps the library order. */
  key: NumericPropertyKey | null;
  direction: SortDirection;
}

function sortMolecules(
  molecules: GeneratedMolecule[],
  sort: SortState,
): GeneratedMolecule[] {
  const key = sort.key;
  if (key === null) return molecules;
  const sign = sort.direction === 'asc' ? 1 : -1;
  return molecules.toSorted(
    (first, second) => sign * (first[key] - second[key]),
  );
}

function cycleSort(current: SortState, key: NumericPropertyKey): SortState {
  if (current.key !== key) return { key, direction: 'asc' };
  if (current.direction === 'asc') return { key, direction: 'desc' };
  return { key: null, direction: 'asc' };
}

function getSortIcon(sort: SortState, key: NumericPropertyKey): IconName {
  if (sort.key !== key) return 'double-caret-vertical';
  return sort.direction === 'asc' ? 'sort-asc' : 'sort-desc';
}

function sortDetail(sort: SortState, key: NumericPropertyKey): string {
  if (sort.key !== key) return 'Click to sort the table on this column';
  return sort.direction === 'asc'
    ? 'Sorted ascending; click to sort descending'
    : 'Sorted descending; click to keep the library order';
}
