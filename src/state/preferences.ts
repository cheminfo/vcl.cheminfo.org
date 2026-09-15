import { signal } from '@preact/signals-react';

import {
  DEFAULT_CORE_MOLFILE,
  createDefaultFragments,
} from '../vcl/defaults.ts';
import type { Fragment, NumericPropertyKey, RGroupKey } from '../vcl/types.ts';
import { NUMERIC_PROPERTIES } from '../vcl/types.ts';

import { persistBucket } from './persist.ts';

const ALL_PROPERTY_KEYS: readonly NumericPropertyKey[] = NUMERIC_PROPERTIES.map(
  (property) => property.key,
);

/**
 * The library the user is building plus their display choices. Persisted under
 * a single localStorage key so a reload never loses the drawings.
 */
export const preferences = persistBucket('vcl:preferences', {
  library: {
    coreMolfile: signal<string>(DEFAULT_CORE_MOLFILE),
    fragments: signal<Fragment[]>(createDefaultFragments()),
  },
  results: {
    axes: signal<NumericPropertyKey[]>([...ALL_PROPERTY_KEYS]),
    columns: signal<NumericPropertyKey[]>([
      'mw',
      'logP',
      'logS',
      'psa',
      'nbHAcceptor',
      'nbHDonor',
      'nbRotatable',
      'nbStereoCenter',
    ]),
    colorBy: signal<NumericPropertyKey>('logP'),
  },
});

/**
 * Replace the core drawing.
 * @param molfile - Molfile V2000 of the new core.
 */
export function setCoreMolfile(molfile: string): void {
  preferences.library.coreMolfile.value = molfile;
}

/**
 * Append a fragment to the library, for example the one just drawn in the add
 * dialog.
 * @param fragment - Fragment to append, with its identifier already generated.
 */
export function addFragment(fragment: Fragment): void {
  preferences.library.fragments.value = [
    ...preferences.library.fragments.value,
    { ...fragment },
  ];
}

/**
 * Replace one fragment as a whole: its drawing, its name and its targets.
 * @param id - Identifier of the fragment to replace.
 * @param fragment - New value of that fragment.
 */
export function updateFragment(id: string, fragment: Fragment): void {
  replaceFragment(id, () => ({ ...fragment }));
}

/**
 * Change the label shown next to a fragment.
 * @param id - Identifier of the fragment.
 * @param name - New label.
 */
export function renameFragment(id: string, name: string): void {
  replaceFragment(id, (fragment) => ({ ...fragment, name }));
}

/**
 * Drop a fragment from the library.
 * @param id - Identifier of the fragment.
 */
export function removeFragment(id: string): void {
  preferences.library.fragments.value =
    preferences.library.fragments.value.filter(
      (fragment) => fragment.id !== id,
    );
}

/**
 * Flip whether a fragment may replace one R group of the core.
 * @param id - Identifier of the fragment.
 * @param key - R group to toggle.
 */
export function toggleFragmentTarget(id: string, key: RGroupKey): void {
  replaceFragment(id, (fragment) => ({
    ...fragment,
    targets: { ...fragment.targets, [key]: !fragment.targets[key] },
  }));
}

/**
 * Replace every target of a fragment at once.
 * @param id - Identifier of the fragment.
 * @param targets - R groups the fragment may replace.
 */
export function setFragmentTargets(
  id: string,
  targets: Record<RGroupKey, boolean>,
): void {
  replaceFragment(id, (fragment) => ({ ...fragment, targets: { ...targets } }));
}

/**
 * Flip whether a fragment takes part in the enumeration.
 * @param id - Identifier of the fragment.
 */
export function toggleFragmentEnabled(id: string): void {
  replaceFragment(id, (fragment) => ({
    ...fragment,
    enabled: !fragment.enabled,
  }));
}

/**
 * Choose which properties the parallel coordinates plot draws, in order.
 * @param axes - Properties to draw.
 */
export function setAxes(axes: NumericPropertyKey[]): void {
  preferences.results.axes.value = [...axes];
}

/**
 * Show or hide one column of the results table. Visible columns always keep the
 * canonical property order.
 * @param key - Property whose column is toggled.
 */
export function toggleColumn(key: NumericPropertyKey): void {
  const current = preferences.results.columns.value;
  const removing = current.includes(key);
  const next: NumericPropertyKey[] = [];
  for (const candidate of ALL_PROPERTY_KEYS) {
    const keep = candidate === key ? !removing : current.includes(candidate);
    if (keep) next.push(candidate);
  }
  preferences.results.columns.value = next;
}

/**
 * Choose the property the plot and the table colour the molecules by.
 * @param key - Property driving the colour scale.
 */
export function setColorBy(key: NumericPropertyKey): void {
  preferences.results.colorBy.value = key;
}

/** Restore the default pyridine core and its eight default fragments. */
export function resetLibrary(): void {
  preferences.library.coreMolfile.value = DEFAULT_CORE_MOLFILE;
  preferences.library.fragments.value = createDefaultFragments();
}

/**
 * Replace the whole library, for example when an example is opened.
 * @param coreMolfile - Molfile V2000 of the core.
 * @param fragments - Fragments of the library.
 */
export function loadLibrary(coreMolfile: string, fragments: Fragment[]): void {
  preferences.library.coreMolfile.value = coreMolfile;
  preferences.library.fragments.value = [...fragments];
}

function replaceFragment(
  id: string,
  update: (fragment: Fragment) => Fragment,
): void {
  preferences.library.fragments.value = preferences.library.fragments.value.map(
    (fragment) => (fragment.id === id ? update(fragment) : fragment),
  );
}
