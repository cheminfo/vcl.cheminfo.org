import { Molecule } from 'openchemlib';
import { expect, test } from 'vitest';

import { analyseCore, normalizeCoreMolfile, parseMolfile } from '../core.ts';
import { DEFAULT_CORE_MOLFILE } from '../defaults.ts';
import { attachRGroup } from '../rgroups.ts';

test('the default core carries R1 to R4', () => {
  expect(analyseCore(DEFAULT_CORE_MOLFILE)).toStrictEqual({
    smilesWithR: '[R4]c(c([R3])c1[R2])cnc1[R1]',
    rGroups: ['R1', 'R2', 'R3', 'R4'],
    atomCount: 10,
    error: null,
  });
});

test('an empty core is reported as empty', () => {
  expect(analyseCore('')).toStrictEqual({
    smilesWithR: '',
    rGroups: [],
    atomCount: 0,
    error: 'Draw a core structure.',
  });
});

test('an unparsable core is reported as empty', () => {
  expect(analyseCore('not a molfile at all')).toStrictEqual({
    smilesWithR: '',
    rGroups: [],
    atomCount: 0,
    error: 'Draw a core structure.',
  });
});

test('a core without R group is rejected', () => {
  expect(analyseCore(benzeneMolfile())).toStrictEqual({
    smilesWithR: '',
    rGroups: [],
    atomCount: 6,
    error:
      'The core needs at least one R group. Hover an atom in the editor, type R1 and press Enter.',
  });
});

test('a core using the same R group twice is rejected', () => {
  const molecule = Molecule.fromMolfile(benzeneMolfile());
  attachRGroup(molecule, 0, 'R1');
  attachRGroup(molecule, 3, 'R1');

  expect(analyseCore(molecule.toMolfile())).toStrictEqual({
    smilesWithR: '',
    rGroups: ['R1'],
    atomCount: 8,
    error: 'R1 is used twice. Each R group may only appear once.',
  });
});

test('the lowest duplicated R group is the one reported', () => {
  const molecule = Molecule.fromMolfile(benzeneMolfile());
  attachRGroup(molecule, 0, 'R3');
  attachRGroup(molecule, 1, 'R3');
  attachRGroup(molecule, 2, 'R2');
  attachRGroup(molecule, 3, 'R2');

  expect(analyseCore(molecule.toMolfile()).error).toBe(
    'R2 is used twice. Each R group may only appear once.',
  );
});

test('parseMolfile rejects blank input and accepts the default core', () => {
  expect(parseMolfile('')).toBeNull();
  expect(parseMolfile('   \n  ')).toBeNull();
  expect(parseMolfile(DEFAULT_CORE_MOLFILE)?.getAllAtoms()).toBe(10);
});

test('a core drawn with R1 to R3 only offers those three positions', () => {
  const molecule = Molecule.fromMolfile(benzeneMolfile());
  attachRGroup(molecule, 0, 'R1');
  attachRGroup(molecule, 2, 'R2');
  attachRGroup(molecule, 4, 'R3');

  expect(analyseCore(molecule.toMolfile())).toStrictEqual({
    smilesWithR: '[R1]c1cc([R2])cc([R3])c1',
    rGroups: ['R1', 'R2', 'R3'],
    atomCount: 9,
    error: null,
  });
});

test('an R typed in the editor takes the lowest free number', () => {
  const molfile = normalizeCoreMolfile(benzeneWithUnnumberedRMolfile());

  expect(analyseCore(molfile)).toStrictEqual({
    smilesWithR: '[R1]c1cc([R2])ccc1',
    rGroups: ['R1', 'R2'],
    atomCount: 8,
    error: null,
  });
});

test('a core keeps the R groups it already numbered', () => {
  const molfile = DEFAULT_CORE_MOLFILE;
  expect(normalizeCoreMolfile(molfile)).toBe(molfile);
});

function benzeneMolfile(): string {
  const molecule = Molecule.fromSmiles('c1ccccc1');
  molecule.inventCoordinates();
  return molecule.toMolfile();
}

function benzeneWithUnnumberedRMolfile(): string {
  const molecule = Molecule.fromMolfile(benzeneMolfile());
  const first = attachRGroup(molecule, 0, 'R1');
  const second = attachRGroup(molecule, 2, 'R2');
  // What the editor emits for an R typed on an atom: the molfile cannot carry
  // an R group without a number, so both come back as `?`.
  molecule.setAtomicNo(first, 0);
  molecule.setAtomicNo(second, 0);
  return molecule.toMolfile();
}
