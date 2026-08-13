import { expect, test } from 'vitest';

import type { GeneratedMolecule } from '../../../vcl/types.ts';
import { findNearestMolecule } from '../parallelCoordinatesHover.ts';
import type { AxisLayout } from '../parallelCoordinatesScales.ts';

const LAYOUTS: AxisLayout[] = [
  { key: 'mw', label: 'MW', x: 0, min: 0, max: 200 },
  { key: 'logP', label: 'logP', x: 400, min: 0, max: 2 },
];

// At an inner height of 200, the polylines run from y = 200 - mw to
// y = 200 - 100 * logP.
const LOW = buildMolecule('low', 50, 0.5);
const MIDDLE = buildMolecule('middle', 100, 1);
const HIGH = buildMolecule('high', 150, 1.5);
const MOLECULES: GeneratedMolecule[] = [LOW, MIDDLE, HIGH];

test('the molecule running under the pointer is picked', () => {
  const nearest = findNearestMolecule(
    { x: 200, y: 100 },
    MOLECULES,
    LAYOUTS,
    200,
  );
  expect(nearest).toBe(MIDDLE);
});

test('a pointer on an axis picks the molecule at that value', () => {
  expect(findNearestMolecule({ x: 0, y: 150 }, MOLECULES, LAYOUTS, 200)).toBe(
    LOW,
  );
  expect(findNearestMolecule({ x: 400, y: 50 }, MOLECULES, LAYOUTS, 200)).toBe(
    HIGH,
  );
});

test('the closest of two neighbouring polylines wins', () => {
  expect(findNearestMolecule({ x: 0, y: 104 }, MOLECULES, LAYOUTS, 200)).toBe(
    MIDDLE,
  );
  expect(findNearestMolecule({ x: 0, y: 146 }, MOLECULES, LAYOUTS, 200)).toBe(
    LOW,
  );
});

test('a pointer further than the tolerance picks nothing', () => {
  expect(
    findNearestMolecule({ x: 200, y: 20 }, MOLECULES, LAYOUTS, 200),
  ).toBeNull();
});

test('a pointer beyond the first or the last axis picks nothing', () => {
  expect(
    findNearestMolecule({ x: -20, y: 100 }, MOLECULES, LAYOUTS, 200),
  ).toBeNull();
  expect(
    findNearestMolecule({ x: 460, y: 100 }, MOLECULES, LAYOUTS, 200),
  ).toBeNull();
});

test('the segment the pointer sits in is the one hit tested', () => {
  const layouts: AxisLayout[] = [
    { key: 'mw', label: 'MW', x: 0, min: 0, max: 200 },
    { key: 'logP', label: 'logP', x: 100, min: 0, max: 2 },
    { key: 'psa', label: 'PSA', x: 200, min: 0, max: 100 },
  ];
  const flat = buildMolecule('flat', 100, 1, 50);
  const bent = buildMolecule('bent', 100, 1, 0);
  // Both molecules share the first segment, so only the second one separates
  // them: at x = 150 the bent one has already dived towards the bottom.
  expect(
    findNearestMolecule({ x: 150, y: 100 }, [flat, bent], layouts, 200),
  ).toBe(flat);
  expect(
    findNearestMolecule({ x: 150, y: 150 }, [flat, bent], layouts, 200),
  ).toBe(bent);
});

test('a single axis cannot be hit tested', () => {
  expect(
    findNearestMolecule({ x: 0, y: 100 }, MOLECULES, LAYOUTS.slice(0, 1), 200),
  ).toBeNull();
  expect(findNearestMolecule({ x: 0, y: 100 }, MOLECULES, [], 200)).toBeNull();
});

test('an empty library picks nothing', () => {
  expect(findNearestMolecule({ x: 200, y: 100 }, [], LAYOUTS, 200)).toBeNull();
});

function buildMolecule(
  idCode: string,
  mw: number,
  logP: number,
  psa = 25.4,
): GeneratedMolecule {
  return {
    idCode,
    smiles: `CC${idCode}`,
    molfile: `${idCode}\nM  END\n`,
    mf: 'C6H7NO',
    mw,
    logP,
    logS: -1.5,
    psa,
    nbHAcceptor: 2,
    nbHDonor: 1,
    nbRotatable: 3,
    nbStereoCenter: 0,
  };
}
