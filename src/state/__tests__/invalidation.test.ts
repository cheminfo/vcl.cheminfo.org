import { afterEach, beforeEach, expect, test } from 'vitest';

import type { Fragment, GeneratedMolecule } from '../../vcl/types.ts';
import { clearResults, data, watchLibraryEdits } from '../data.ts';
import {
  preferences,
  removeFragment,
  renameFragment,
  resetLibrary,
  setCoreMolfile,
  toggleFragmentEnabled,
  toggleFragmentTarget,
  updateFragment,
} from '../preferences.ts';
import { selectMolecule, setBrushRange, view } from '../view.ts';

const MOLECULE: GeneratedMolecule = {
  idCode: 'gFp@DiTtb',
  smiles: 'CC(=O)c1ccncc1',
  molfile: 'gFp@DiTtb\nM  END\n',
  mf: 'C7H7NO',
  mw: 121.14,
  logP: 0.85,
  logS: -1.2,
  psa: 30.1,
  nbHAcceptor: 2,
  nbHDonor: 0,
  nbRotatable: 1,
  nbStereoCenter: 0,
};

let stopWatching: (() => void) | null = null;

function fragmentAt(index: number): Fragment {
  const fragment = preferences.library.fragments.value[index];
  if (fragment === undefined) {
    throw new Error(`there is no fragment at index ${index}`);
  }
  return fragment;
}

function hasLibrary(): boolean {
  return (
    data.molecules.value.length > 0 ||
    data.status.value !== 'idle' ||
    data.durationMs.value !== null
  );
}

beforeEach(() => {
  resetLibrary();
  stopWatching = watchLibraryEdits();
  data.molecules.value = [MOLECULE];
  data.durationMs.value = 139;
  data.status.value = 'done';
});

afterEach(() => {
  stopWatching?.();
  stopWatching = null;
  clearResults();
});

test('editing a fragment drawing throws the library away', () => {
  const fragment = fragmentAt(0);
  updateFragment(fragment.id, { ...fragment, molfile: fragmentAt(4).molfile });

  expect(data.molecules.value).toStrictEqual([]);
  expect(data.status.value).toBe('idle');
  expect(data.durationMs.value).toBeNull();
});

test('renaming a fragment keeps the library', () => {
  renameFragment(fragmentAt(0).id, 'acetyl (renamed)');

  expect(data.molecules.value).toStrictEqual([MOLECULE]);
  expect(data.status.value).toBe('done');
  expect(data.durationMs.value).toBe(139);
});

test('retargeting a fragment throws the library away', () => {
  toggleFragmentTarget(fragmentAt(1).id, 'R2');

  expect(hasLibrary()).toBe(false);
  expect(data.molecules.value).toStrictEqual([]);
});

test('disabling a fragment throws the library away', () => {
  toggleFragmentEnabled(fragmentAt(2).id);

  expect(hasLibrary()).toBe(false);
});

test('removing a fragment throws the library away', () => {
  removeFragment(fragmentAt(3).id);

  expect(hasLibrary()).toBe(false);
});

test('editing the core throws the library away', () => {
  setCoreMolfile('');

  expect(hasLibrary()).toBe(false);
});

test('the library is thrown away once, then survives until the next edit', () => {
  removeFragment(fragmentAt(0).id);
  expect(hasLibrary()).toBe(false);

  data.molecules.value = [MOLECULE];
  data.status.value = 'done';
  renameFragment(fragmentAt(0).id, 'hydroxymethyl (renamed)');
  expect(data.molecules.value).toStrictEqual([MOLECULE]);

  removeFragment(fragmentAt(0).id);
  expect(hasLibrary()).toBe(false);
});

test('the brushes and the selection go with the library', () => {
  setBrushRange('mw', [100, 200]);
  selectMolecule(MOLECULE.idCode);

  setCoreMolfile('');

  expect(view.brushRanges.value).toStrictEqual({});
  expect(view.selectedIdCode.value).toBeNull();
});

test('a stopped watcher no longer throws the library away', () => {
  stopWatching?.();
  stopWatching = null;

  removeFragment(fragmentAt(0).id);

  expect(data.molecules.value).toStrictEqual([MOLECULE]);
  expect(data.status.value).toBe('done');
});

test('clearResults resets the progress and the error too', () => {
  data.progressDone.value = 12;
  data.progressTotal.value = 14;
  data.error.value = 'boom';

  clearResults();

  expect(data.progressDone.value).toBe(0);
  expect(data.progressTotal.value).toBe(0);
  expect(data.error.value).toBeNull();
  expect(data.status.value).toBe('idle');
});
