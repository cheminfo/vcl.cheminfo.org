import { beforeEach, expect, test } from 'vitest';

import {
  DEFAULT_CORE_MOLFILE,
  createEmptyFragment,
} from '../../vcl/defaults.ts';
import type { Fragment } from '../../vcl/types.ts';
import {
  addFragment,
  loadLibrary,
  preferences,
  removeFragment,
  renameFragment,
  resetLibrary,
  setAxes,
  setColorBy,
  setCoreMolfile,
  setFragmentTargets,
  toggleColumn,
  toggleFragmentEnabled,
  toggleFragmentTarget,
  updateFragment,
} from '../preferences.ts';

function fragmentAt(index: number): Fragment {
  const fragment = preferences.library.fragments.value[index];
  if (fragment === undefined) {
    throw new Error(`there is no fragment at index ${index}`);
  }
  return fragment;
}

beforeEach(() => {
  resetLibrary();
});

test('the default library is the pyridine core and eight fragments', () => {
  expect(preferences.library.coreMolfile.value).toBe(DEFAULT_CORE_MOLFILE);
  expect(preferences.library.fragments.value).toHaveLength(8);
  expect(fragmentAt(0).name).toBe('acetyl');
  expect(fragmentAt(7).name).toBe('hydrogen (no substituent)');
  expect(fragmentAt(0).targets).toStrictEqual({
    R1: true,
    R2: true,
    R3: true,
    R4: true,
  });
});

test('addFragment appends a copy of the given fragment', () => {
  const before = preferences.library.fragments.value;
  const fragment = createEmptyFragment();
  addFragment(fragment);
  const after = preferences.library.fragments.value;

  expect(after).not.toBe(before);
  expect(after).toHaveLength(9);
  const added = fragmentAt(8);
  expect(added).not.toBe(fragment);
  expect(added.id).toBe(fragment.id);
  expect(added.name).toBe('New fragment');
  expect(added.molfile).toBe('');
  expect(added.enabled).toBe(true);
  expect(added.targets).toStrictEqual({
    R1: true,
    R2: true,
    R3: true,
    R4: true,
  });
});

test('updateFragment replaces one fragment and leaves the others alone', () => {
  const before = preferences.library.fragments.value;
  const fragment = fragmentAt(1);
  updateFragment(fragment.id, { ...fragment, molfile: 'MOLFILE' });

  expect(preferences.library.fragments.value).not.toBe(before);
  expect(fragmentAt(1).molfile).toBe('MOLFILE');
  expect(fragmentAt(1).name).toBe('hydroxymethyl');
  expect(preferences.library.fragments.value[0]).toBe(before[0]);
  expect(preferences.library.fragments.value[2]).toBe(before[2]);
});

test('renameFragment changes only the label', () => {
  const { id, molfile } = fragmentAt(0);
  renameFragment(id, 'acetyl (renamed)');

  expect(fragmentAt(0).name).toBe('acetyl (renamed)');
  expect(fragmentAt(0).molfile).toBe(molfile);
});

test('toggleFragmentTarget flips R2 and leaves R1, R3 and R4 untouched', () => {
  const before = preferences.library.fragments.value;
  const { id } = fragmentAt(0);
  toggleFragmentTarget(id, 'R2');

  expect(preferences.library.fragments.value).not.toBe(before);
  expect(fragmentAt(0).targets).toStrictEqual({
    R1: true,
    R2: false,
    R3: true,
    R4: true,
  });

  toggleFragmentTarget(id, 'R2');
  expect(fragmentAt(0).targets).toStrictEqual({
    R1: true,
    R2: true,
    R3: true,
    R4: true,
  });
});

test('setFragmentTargets replaces the whole record with a copy', () => {
  const { id } = fragmentAt(3);
  const targets = { R1: false, R2: true, R3: false, R4: false };
  setFragmentTargets(id, targets);

  expect(fragmentAt(3).targets).toStrictEqual({
    R1: false,
    R2: true,
    R3: false,
    R4: false,
  });
  expect(fragmentAt(3).targets).not.toBe(targets);
});

test('toggleFragmentEnabled excludes and includes a fragment again', () => {
  const { id } = fragmentAt(2);
  toggleFragmentEnabled(id);
  expect(fragmentAt(2).enabled).toBe(false);

  toggleFragmentEnabled(id);
  expect(fragmentAt(2).enabled).toBe(true);
});

test('removeFragment drops exactly one fragment', () => {
  const before = preferences.library.fragments.value;
  const { id } = fragmentAt(4);
  removeFragment(id);
  const after = preferences.library.fragments.value;

  expect(after).not.toBe(before);
  expect(after).toHaveLength(7);
  expect(after.map((fragment) => fragment.id)).not.toContain(id);
  expect(after.map((fragment) => fragment.name)).toStrictEqual([
    'acetyl',
    'hydroxymethyl',
    'N-methylaminomethyl',
    'ethoxymethyl',
    'ethyl',
    'propyl',
    'hydrogen (no substituent)',
  ]);
});

test('setCoreMolfile replaces the core drawing', () => {
  setCoreMolfile('CORE');
  expect(preferences.library.coreMolfile.value).toBe('CORE');
});

test('resetLibrary restores the default core and the eight fragments', () => {
  setCoreMolfile('CORE');
  removeFragment(fragmentAt(0).id);
  const before = preferences.library.fragments.value;

  resetLibrary();

  expect(preferences.library.coreMolfile.value).toBe(DEFAULT_CORE_MOLFILE);
  expect(preferences.library.fragments.value).not.toBe(before);
  expect(preferences.library.fragments.value).toHaveLength(8);
  expect(fragmentAt(0).name).toBe('acetyl');
});

test('loadLibrary installs another core and its own fragments', () => {
  const fragments: Fragment[] = [
    {
      id: 'fragment-1',
      name: 'methyl',
      molfile: 'METHYL',
      targets: { R1: true, R2: false, R3: false, R4: false },
      enabled: true,
    },
  ];
  loadLibrary('OTHER CORE', fragments);

  expect(preferences.library.coreMolfile.value).toBe('OTHER CORE');
  expect(preferences.library.fragments.value).not.toBe(fragments);
  expect(preferences.library.fragments.value).toStrictEqual(fragments);
});

test('toggleColumn hides a column and restores it in the canonical order', () => {
  const before = preferences.results.columns.value;
  toggleColumn('logS');

  expect(preferences.results.columns.value).not.toBe(before);
  expect(preferences.results.columns.value).toStrictEqual([
    'mw',
    'logP',
    'psa',
    'nbHAcceptor',
    'nbHDonor',
    'nbRotatable',
    'nbStereoCenter',
  ]);

  toggleColumn('logS');
  expect(preferences.results.columns.value).toStrictEqual([
    'mw',
    'logP',
    'logS',
    'psa',
    'nbHAcceptor',
    'nbHDonor',
    'nbRotatable',
    'nbStereoCenter',
  ]);
});

test('setAxes stores a copy of the requested axes', () => {
  const axes = ['logP', 'mw'] as const;
  setAxes([...axes]);

  expect(preferences.results.axes.value).toStrictEqual(['logP', 'mw']);

  setAxes(['mw', 'logP', 'psa']);
  expect(preferences.results.axes.value).toStrictEqual(['mw', 'logP', 'psa']);
});

test('setColorBy picks the property driving the colour scale', () => {
  setColorBy('psa');
  expect(preferences.results.colorBy.value).toBe('psa');

  setColorBy('logP');
  expect(preferences.results.colorBy.value).toBe('logP');
});
