import { signal } from '@preact/signals-react';
import type { TabRoute } from 'react-cheminfo/core';
import {
  createTabRouter,
  pathFromLegacyHash as legacyHashPath,
} from 'react-cheminfo/core';

import type { NumericPropertyKey, Range } from '../vcl/types.ts';
import { NUMERIC_PROPERTIES } from '../vcl/types.ts';

import { withBase } from './site.ts';

/**
 * The top level pages of the application. `about` is one of them and not a tab
 * of the bar: it is a routed address, listed in the utilities on the right.
 */
export type TabId = 'builder' | 'examples' | 'help' | 'about';

export const TAB_IDS: readonly TabId[] = [
  'builder',
  'examples',
  'help',
  'about',
];

/** What the user is currently looking at. Session only, never persisted. */
export const view = {
  activeTab: signal<TabId>('builder'),
  selectedFragmentId: signal<string | null>(null),
  selectedIdCode: signal<string | null>(null),
  brushRanges: signal<Partial<Record<NumericPropertyKey, Range>>>({}),
  /** Molecule the pointer is over in the plot. The table follows it. */
  plotHoverIdCode: signal<string | null>(null),
  /** Molecule the pointer is over in the table. The plot follows it. */
  tableHoverIdCode: signal<string | null>(null),
};

/**
 * Show another tab.
 * @param tab - Tab to show.
 */
export function setActiveTab(tab: TabId): void {
  view.activeTab.value = tab;
}

/**
 * Select the fragment whose drawing is being edited.
 * @param id - Identifier of the fragment, or `null` to select none.
 */
export function selectFragment(id: string | null): void {
  view.selectedFragmentId.value = id;
}

/**
 * Select the molecule shown in the detail panel.
 * @param idCode - ID code of the molecule, or `null` to select none.
 */
export function selectMolecule(idCode: string | null): void {
  view.selectedIdCode.value = idCode;
}

/**
 * Highlight, from the plot, the molecule the pointer is over.
 * @param idCode - ID code of the molecule, or `null` when the pointer left it.
 */
export function hoverMoleculeInPlot(idCode: string | null): void {
  view.plotHoverIdCode.value = idCode;
}

/**
 * Highlight, from the table, the molecule the pointer is over.
 * @param idCode - ID code of the molecule, or `null` when the pointer left it.
 */
export function hoverMoleculeInTable(idCode: string | null): void {
  view.tableHoverIdCode.value = idCode;
}

/** Forget both hovers, e.g. when the library they point into is replaced. */
export function clearHoveredMolecules(): void {
  view.plotHoverIdCode.value = null;
  view.tableHoverIdCode.value = null;
}

/**
 * Apply or remove the brush of one parallel coordinates axis.
 * @param key - Property the axis draws.
 * @param range - Inclusive range kept by the brush, or `null` to remove it.
 */
export function setBrushRange(
  key: NumericPropertyKey,
  range: Range | null,
): void {
  const current = view.brushRanges.value;
  if (range !== null) {
    view.brushRanges.value = { ...current, [key]: range };
    return;
  }

  const next: Partial<Record<NumericPropertyKey, Range>> = {};
  for (const property of NUMERIC_PROPERTIES) {
    if (property.key === key) continue;
    const existing = current[property.key];
    if (existing !== undefined) next[property.key] = existing;
  }
  view.brushRanges.value = next;
}

/** Remove every brush, so the whole library is shown again. */
export function clearBrushRanges(): void {
  view.brushRanges.value = {};
}

/** What the address names: a tab, optionally the anchor it scrolls to. */
export type Route = TabRoute<TabId>;

/**
 * The two directions between an address and the page it names.
 *
 * Routing is path based through the History API, so every tab is an address a
 * crawler can fetch and a link can be handed out — a `#` is dropped by half the
 * tools that pass links around, and the server never sees it. The builder is
 * the home page rather than a page beside it, so the site has one address for
 * it instead of two holding the same thing, and a chapter of the manual is the
 * second segment of `/help`.
 */
export const router = createTabRouter<TabId>({
  tabs: ['builder', 'examples', { id: 'help', takesId: true }, 'about'],
  home: 'builder',
});

/**
 * The address a link written before this site routed by path points at. Those
 * links are in bookmarks and in other people's pages, so they are answered
 * rather than dropped.
 * @param address - The address the browser is on, fragment included.
 * @returns The path it means, or null when the fragment names no tab.
 */
export function pathFromLegacyHash(address: string): string | null {
  const legacy = legacyHashPath(address);
  if (legacy === null) return null;
  // A fragment naming no tab is an anchor inside a page, not an address.
  const [, first = ''] = legacy.split(/[/?]/);
  return router.isTab(first) ? router.format(router.parse(legacy)) : null;
}

/**
 * Put the address a legacy hash link meant in the bar, before anything reads
 * it. Called once, at startup.
 */
export function adoptLegacyHashAddress(): void {
  const { pathname, search, hash } = globalThis.location;
  const path = pathFromLegacyHash(`${pathname}${search}${hash}`);
  if (path !== null) globalThis.history.replaceState(null, '', withBase(path));
}
