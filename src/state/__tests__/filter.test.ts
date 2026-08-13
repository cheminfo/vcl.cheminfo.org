import { beforeEach, expect, test } from 'vitest';

import type { GeneratedMolecule } from '../../vcl/types.ts';
import { data, filteredMolecules } from '../data.ts';
import { clearBrushRanges, setBrushRange } from '../view.ts';

function buildMolecule(
  idCode: string,
  mw: number,
  logP: number,
  nbHDonor: number,
): GeneratedMolecule {
  return {
    idCode,
    smiles: `CC${idCode}`,
    molfile: `${idCode}\nM  END\n`,
    mf: 'C6H7NO',
    mw,
    logP,
    logS: -1.5,
    psa: 25.4,
    nbHAcceptor: 2,
    nbHDonor,
    nbRotatable: 3,
    nbStereoCenter: 0,
  };
}

const MOLECULES: GeneratedMolecule[] = [
  buildMolecule('gJPHADIfj', 100, -1.5, 0),
  buildMolecule('gFp@DiTtb', 150, 0.5, 1),
  buildMolecule('dmvDDHbaP', 200, 1.5, 2),
  buildMolecule('gOpHAKAIR', 250, 2.5, 1),
  buildMolecule('daxDpDjYf', 300, 3.5, 3),
  buildMolecule('efqTPTAiJ', 350, 4.5, 0),
];

function keptIdCodes(): string[] {
  return filteredMolecules.value.map((molecule) => molecule.idCode);
}

beforeEach(() => {
  clearBrushRanges();
  data.molecules.value = MOLECULES;
});

test('without a brush the very same array is returned', () => {
  expect(filteredMolecules.value).toBe(data.molecules.value);
  expect(filteredMolecules.value).toHaveLength(6);
});

test('one brush keeps the molecules inside its inclusive bounds', () => {
  setBrushRange('mw', [150, 250]);

  expect(keptIdCodes()).toStrictEqual(['gFp@DiTtb', 'dmvDDHbaP', 'gOpHAKAIR']);
});

test('a brush whose bounds fall between two values keeps only one molecule', () => {
  setBrushRange('mw', [199.5, 249.5]);

  expect(keptIdCodes()).toStrictEqual(['dmvDDHbaP']);
});

test('two brushes are combined', () => {
  setBrushRange('mw', [150, 300]);
  setBrushRange('logP', [1.5, 3.5]);

  expect(keptIdCodes()).toStrictEqual(['dmvDDHbaP', 'gOpHAKAIR', 'daxDpDjYf']);

  setBrushRange('nbHDonor', [1, 1]);
  expect(keptIdCodes()).toStrictEqual(['gOpHAKAIR']);
});

test('a brush matching nothing keeps no molecule', () => {
  setBrushRange('mw', [1000, 2000]);

  expect(filteredMolecules.value).toHaveLength(0);
  expect(keptIdCodes()).toStrictEqual([]);
});

test('removing a brush widens the selection again', () => {
  setBrushRange('mw', [150, 300]);
  setBrushRange('logP', [3.5, 10]);
  expect(keptIdCodes()).toStrictEqual(['daxDpDjYf']);

  setBrushRange('logP', null);
  expect(keptIdCodes()).toStrictEqual([
    'gFp@DiTtb',
    'dmvDDHbaP',
    'gOpHAKAIR',
    'daxDpDjYf',
  ]);

  setBrushRange('mw', null);
  expect(filteredMolecules.value).toBe(data.molecules.value);
});

test('clearBrushRanges gives the untouched array back', () => {
  setBrushRange('mw', [150, 250]);
  expect(filteredMolecules.value).not.toBe(data.molecules.value);

  clearBrushRanges();
  expect(filteredMolecules.value).toBe(data.molecules.value);
});
