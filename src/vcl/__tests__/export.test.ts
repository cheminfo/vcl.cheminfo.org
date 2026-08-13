import { expect, test } from 'vitest';

import { toCSV, toSDF, toSmilesList } from '../export.ts';
import type { GeneratedMolecule } from '../types.ts';

const moleculeA: GeneratedMolecule = {
  idCode: 'gCa@@eJfR',
  smiles: 'Cc1ccccn1',
  molfile: 'moleculeA\nM  END\n',
  mf: 'C6H7N',
  mw: 93.13,
  logP: 1.42,
  logS: -1.05,
  psa: 12.89,
  nbHAcceptor: 1,
  nbHDonor: 0,
  nbRotatable: 0,
  nbStereoCenter: 0,
};

const moleculeB: GeneratedMolecule = {
  idCode: 'daD@@RVfT',
  smiles: 'Clc1ccccn1',
  molfile: 'moleculeB\nM  END',
  mf: 'C5H4ClN',
  mw: 113.55,
  logP: 1.987,
  logS: -2.114,
  psa: 12.89,
  nbHAcceptor: 1,
  nbHDonor: 0,
  nbRotatable: 0,
  nbStereoCenter: 1,
};

const moleculeWithSeparators: GeneratedMolecule = {
  idCode: 'eF@HbAiE',
  smiles: 'C,"C"',
  molfile: 'moleculeC\nM  END\n\n',
  mf: 'C2H6',
  mw: 30.07,
  logP: 1.09,
  logS: -1.36,
  psa: 0,
  nbHAcceptor: 0,
  nbHDonor: 0,
  nbRotatable: 0,
  nbStereoCenter: 0,
};

test('toSmilesList writes one SMILES per line', () => {
  expect(toSmilesList([moleculeA, moleculeB])).toBe('Cc1ccccn1\nClc1ccccn1\n');
});

test('toSmilesList of an empty library is empty', () => {
  expect(toSmilesList([])).toBe('');
});

test('toCSV writes the machine readable header and rounded values', () => {
  const lines = toCSV([moleculeA, moleculeB]).split('\n');
  expect(lines).toStrictEqual([
    'smiles,mf,mw,logP,logS,psa,nbHAcceptor,nbHDonor,nbRotatable,nbStereoCenter',
    'Cc1ccccn1,C6H7N,93.13,1.42,-1.05,12.89,1,0,0,0',
    'Clc1ccccn1,C5H4ClN,113.55,1.99,-2.11,12.89,1,0,0,1',
    '',
  ]);
});

test('toCSV quotes a value holding a comma or a quote', () => {
  const lines = toCSV([moleculeWithSeparators]).split('\n');
  expect(lines[1]).toBe('"C,""C""",C2H6,30.07,1.09,-1.36,0.00,0,0,0,0');
});

test('toSDF writes one terminated record per molecule', () => {
  const sdf = toSDF([moleculeA, moleculeB, moleculeWithSeparators]);
  expect(sdf.split('$$$$\n')).toHaveLength(4);
  expect(sdf.startsWith('moleculeA\nM  END\n>  <smiles>\n')).toBe(true);
  expect(sdf).toContain('>  <logP>\n1.42\n\n');
  expect(sdf).toContain('$$$$\nmoleculeB\nM  END\n>  <smiles>\n');
  expect(sdf).toContain('$$$$\nmoleculeC\nM  END\n>  <smiles>\n');
  expect(sdf.endsWith('>  <nbStereoCenter>\n0\n\n$$$$\n')).toBe(true);
});

test('toSDF writes every exported field of one molecule', () => {
  expect(toSDF([moleculeA])).toBe(`moleculeA
M  END
>  <smiles>
Cc1ccccn1

>  <mf>
C6H7N

>  <idCode>
gCa@@eJfR

>  <mw>
93.13

>  <logP>
1.42

>  <logS>
-1.05

>  <psa>
12.89

>  <nbHAcceptor>
1

>  <nbHDonor>
0

>  <nbRotatable>
0

>  <nbStereoCenter>
0

$$$$
`);
});
