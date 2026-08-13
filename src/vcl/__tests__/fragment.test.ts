import { Molecule } from 'openchemlib';
import { expect, test } from 'vitest';

import { createDefaultFragments } from '../defaults.ts';
import {
  analyseFragment,
  normalizeFragmentMolfile,
  setFragmentAttachment,
} from '../fragment.ts';
import { attachRGroup } from '../rgroups.ts';

test('every default fragment has exactly one attachment point', () => {
  const infos = createDefaultFragments().map((fragment) =>
    analyseFragment(fragment.molfile),
  );

  expect(infos.map((info) => info.smilesWithR)).toStrictEqual([
    'CC([R])=O',
    'OC[R]',
    'CNC[R]',
    'CCOC[R]',
    '[R]c1ccccc1',
    'CC[R]',
    'CCC[R]',
    '[R]',
  ]);
  expect(infos.map((info) => info.rCount)).toStrictEqual([
    1, 1, 1, 1, 1, 1, 1, 1,
  ]);
  expect(infos.map((info) => info.atomCount)).toStrictEqual([
    4, 3, 4, 5, 7, 3, 4, 1,
  ]);
  expect(infos.map((info) => info.error)).toStrictEqual([
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ]);
});

test('an empty fragment is reported as empty', () => {
  expect(analyseFragment('')).toStrictEqual({
    smilesWithR: '',
    rCount: 0,
    atomCount: 0,
    error: 'Draw a fragment.',
  });
});

test('a fragment without R atom is rejected', () => {
  expect(analyseFragment(ethanolMolfile())).toStrictEqual({
    smilesWithR: '',
    rCount: 0,
    atomCount: 3,
    error:
      'The fragment needs exactly one R atom to mark where it attaches to the core.',
  });
});

test('a fragment with two R atoms is rejected', () => {
  expect(analyseFragment(ethanolWithTwoRMolfile())).toStrictEqual({
    smilesWithR: '',
    rCount: 2,
    atomCount: 5,
    error: 'The fragment has 2 R atoms; it must have exactly one.',
  });
});

test('an R2 attachment point is normalised to a bare R token', () => {
  const molecule = Molecule.fromMolfile(ethanolMolfile());
  attachRGroup(molecule, 0, 'R2');

  expect(analyseFragment(molecule.toMolfile())).toStrictEqual({
    smilesWithR: 'OCC[R]',
    rCount: 1,
    atomCount: 4,
    error: null,
  });
});

test('the attachment point moves to the clicked atom', () => {
  const moved = setFragmentAttachment(ethanolWithR1Molfile(), 2);

  expect(analyseFragment(moved)).toStrictEqual({
    smilesWithR: 'CCO[R]',
    rCount: 1,
    atomCount: 4,
    error: null,
  });
});

test('setting the attachment point drops every other R atom', () => {
  const moved = setFragmentAttachment(ethanolWithTwoRMolfile(), 1);

  expect(analyseFragment(moved)).toStrictEqual({
    smilesWithR: 'CC(O)[R]',
    rCount: 1,
    atomCount: 4,
    error: null,
  });
});

test('clicking one of several R atoms keeps that one', () => {
  const moved = setFragmentAttachment(ethanolWithTwoRMolfile(), 3);

  expect(analyseFragment(moved)).toStrictEqual({
    smilesWithR: 'OCC[R]',
    rCount: 1,
    atomCount: 4,
    error: null,
  });
});

test('clicking the single R atom changes nothing', () => {
  const molfile = ethanolWithR1Molfile();
  expect(setFragmentAttachment(molfile, 3)).toBe(molfile);
});

test('clicking outside the molecule leaves the fragment untouched', () => {
  const molfile = ethanolWithR1Molfile();
  expect(setFragmentAttachment(molfile, 4)).toBe(molfile);
  expect(setFragmentAttachment(molfile, -1)).toBe(molfile);
  expect(setFragmentAttachment('', 0)).toBe('');
});

test('an R typed in the editor becomes the attachment point', () => {
  const molfile = normalizeFragmentMolfile(ethanolWithUnnumberedRMolfile());

  expect(analyseFragment(molfile)).toStrictEqual({
    smilesWithR: 'OCC[R]',
    rCount: 1,
    atomCount: 4,
    error: null,
  });
});

test('the attachment point of a fragment is drawn as a bare R', () => {
  const molecule = Molecule.fromMolfile(
    normalizeFragmentMolfile(ethanolWithR1Molfile()),
  );

  expect(molecule.getAtomLabel(3)).toBe('R1');
  expect(molecule.getAtomCustomLabel(3)).toBe('R');
});

test('every default fragment is drawn as a bare R', () => {
  const labels = createDefaultFragments().map((fragment) => {
    const molecule = Molecule.fromMolfile(fragment.molfile);
    const atomCount = molecule.getAllAtoms();
    const labels: Array<string | null> = [];
    for (let atom = 0; atom < atomCount; atom++) {
      if (molecule.getAtomLabel(atom) === 'R1') {
        labels.push(molecule.getAtomCustomLabel(atom));
      }
    }
    return labels;
  });

  expect(labels).toStrictEqual([
    ['R'],
    ['R'],
    ['R'],
    ['R'],
    ['R'],
    ['R'],
    ['R'],
    ['R'],
  ]);
});

test('a fragment already drawn as a bare R is left alone', () => {
  const molfile = normalizeFragmentMolfile(ethanolWithR1Molfile());
  expect(normalizeFragmentMolfile(molfile)).toBe(molfile);
});

function ethanolMolfile(): string {
  const molecule = Molecule.fromSmiles('CCO');
  molecule.inventCoordinates();
  return molecule.toMolfile();
}

function ethanolWithR1Molfile(): string {
  const molecule = Molecule.fromMolfile(ethanolMolfile());
  attachRGroup(molecule, 0, 'R1');
  return molecule.toMolfile();
}

function ethanolWithTwoRMolfile(): string {
  const molecule = Molecule.fromMolfile(ethanolWithR1Molfile());
  attachRGroup(molecule, 2, 'R2');
  return molecule.toMolfile();
}

function ethanolWithUnnumberedRMolfile(): string {
  const molecule = Molecule.fromMolfile(ethanolWithR1Molfile());
  // What the editor emits for an R typed on an atom: the molfile cannot carry
  // an R group without a number, so it comes back as `?`.
  molecule.setAtomicNo(3, 0);
  return molecule.toMolfile();
}
