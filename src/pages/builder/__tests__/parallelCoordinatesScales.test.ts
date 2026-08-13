import { expect, test } from 'vitest';

import type { GeneratedMolecule } from '../../../vcl/types.ts';
import type { AxisLayout } from '../parallelCoordinatesScales.ts';
import {
  buildTicks,
  computeAxisLayouts,
  valueToColor,
  valueToY,
  yToValue,
} from '../parallelCoordinatesScales.ts';

const MOLECULES: GeneratedMolecule[] = [
  buildMolecule('gJPHADIfj', { mw: 100, logP: -1.5, nbHDonor: 0 }),
  buildMolecule('gJPHADIfk', { mw: 300, logP: 2.5, nbHDonor: 2 }),
  buildMolecule('gJPHADIfl', { mw: 500, logP: 0.5, nbHDonor: 1 }),
];

test('two axes are placed at both ends of the drawing area', () => {
  const layouts = computeAxisLayouts(MOLECULES, ['mw', 'logP'], 800);
  expect(layouts).toStrictEqual([
    { key: 'mw', label: 'MW', x: 0, min: 100, max: 500 },
    { key: 'logP', label: 'logP', x: 800, min: -1.5, max: 2.5 },
  ]);
});

test('eight axes are evenly spaced', () => {
  const layouts = computeAxisLayouts(
    MOLECULES,
    [
      'mw',
      'logP',
      'logS',
      'psa',
      'nbHAcceptor',
      'nbHDonor',
      'nbRotatable',
      'nbStereoCenter',
    ],
    700,
  );
  const positions: number[] = [];
  for (const layout of layouts) positions.push(layout.x);
  expect(positions).toStrictEqual([0, 100, 200, 300, 400, 500, 600, 700]);
  expect(layouts).toHaveLength(8);
});

test('a single axis is centred', () => {
  const layouts = computeAxisLayouts(MOLECULES, ['mw'], 640);
  expect(layouts).toStrictEqual([
    { key: 'mw', label: 'MW', x: 320, min: 100, max: 500 },
  ]);
});

test('a constant property is padded to a half unit on each side', () => {
  const layouts = computeAxisLayouts(MOLECULES, ['logS'], 100);
  expect(layouts).toStrictEqual([
    { key: 'logS', label: 'logS', x: 50, min: -2, max: -1 },
  ]);
});

test('an empty library still yields a drawable extent', () => {
  const layouts = computeAxisLayouts([], ['nbHDonor'], 200);
  expect(layouts).toStrictEqual([
    { key: 'nbHDonor', label: 'H donors', x: 100, min: -0.5, max: 0.5 },
  ]);
});

test('no axis is laid out when no property is requested', () => {
  expect(computeAxisLayouts(MOLECULES, [], 800)).toStrictEqual([]);
});

test('the maximum sits at the top of the axis and the minimum at the bottom', () => {
  const axis = buildAxis(0, 10);
  expect(valueToY(10, axis, 200)).toBe(0);
  expect(valueToY(5, axis, 200)).toBe(100);
  expect(valueToY(0, axis, 200)).toBe(200);
  expect(valueToY(2.5, axis, 200)).toBe(150);
});

test('a value outside the extent maps outside the drawing area', () => {
  const axis = buildAxis(0, 10);
  expect(valueToY(12, axis, 200)).toBe(-40);
  expect(valueToY(-1, axis, 200)).toBeCloseTo(220, 9);
});

test('a pixel maps back to the value that produced it', () => {
  const axis = buildAxis(-3.25, 8.75);
  for (const value of [-3.25, -1, 0, 1.125, 4.5, 8.75]) {
    expect(yToValue(valueToY(value, axis, 264), axis, 264)).toBeCloseTo(
      value,
      9,
    );
  }
});

test('a flat drawing area cannot be inverted', () => {
  const axis = buildAxis(0, 10);
  expect(valueToY(5, axis, 0)).toBe(0);
  expect(yToValue(0, axis, 0)).toBe(10);
});

test('the colour runs from red at the minimum to blue at the maximum', () => {
  expect(valueToColor(0, 0, 10)).toBe('hsl(360, 65%, 65%)');
  expect(valueToColor(5, 0, 10)).toBe('hsl(300, 65%, 65%)');
  expect(valueToColor(10, 0, 10)).toBe('hsl(240, 65%, 65%)');
});

test('the colour ratio is clamped and a flat extent stays red', () => {
  expect(valueToColor(-4, 0, 10)).toBe('hsl(360, 65%, 65%)');
  expect(valueToColor(40, 0, 10)).toBe('hsl(240, 65%, 65%)');
  expect(valueToColor(7, 7, 7)).toBe('hsl(360, 65%, 65%)');
  expect(valueToColor(Number.NaN, 0, 10)).toBe('hsl(360, 65%, 65%)');
});

test('an axis carries five ticks formatted with the property decimals', () => {
  const ticks = buildTicks(buildAxis(0, 500), 200);
  expect(ticks).toStrictEqual([
    { value: 0, y: 200, text: '0.00' },
    { value: 125, y: 150, text: '125.00' },
    { value: 250, y: 100, text: '250.00' },
    { value: 375, y: 50, text: '375.00' },
    { value: 500, y: 0, text: '500.00' },
  ]);
});

test('a tick repeating the formatted value of the previous one is dropped', () => {
  const ticks = buildTicks(
    { key: 'nbHDonor', label: 'H donors', x: 0, min: 0, max: 2 },
    200,
  );
  const texts: string[] = [];
  for (const tick of ticks) texts.push(tick.text);
  expect(texts).toStrictEqual(['0', '1', '2']);
  expect(ticks).toHaveLength(3);
});

function buildAxis(min: number, max: number): AxisLayout {
  return { key: 'mw', label: 'MW', x: 0, min, max };
}

function buildMolecule(
  idCode: string,
  values: { mw: number; logP: number; nbHDonor: number },
): GeneratedMolecule {
  return {
    idCode,
    smiles: `CC${idCode}`,
    molfile: `${idCode}\nM  END\n`,
    mf: 'C6H7NO',
    mw: values.mw,
    logP: values.logP,
    logS: -1.5,
    psa: 25.4,
    nbHAcceptor: 2,
    nbHDonor: values.nbHDonor,
    nbRotatable: 3,
    nbStereoCenter: 0,
  };
}
