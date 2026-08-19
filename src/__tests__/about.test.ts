import { aboutProblems, resolveAbout } from 'react-cheminfo/core';
import { expect, test } from 'vitest';

import { ABOUT } from '../about.ts';
import { PAPER } from '../paper.ts';

test('the record says what the family checks it says', () => {
  expect(aboutProblems(ABOUT)).toStrictEqual([]);
});

test('what a visitor is told they can do is the six steps of the tool', () => {
  expect(ABOUT.can).toHaveLength(6);
  expect(ABOUT.paragraphs).toHaveLength(2);
  expect(ABOUT.siteId).toBe('vcl');
});

test('every borrowed work the site runs on is named, and named once', () => {
  expect(ABOUT.credits).toStrictEqual([
    'openchemlib',
    'openchemlib-utils',
    'react-ocl',
    'react-mf',
    'blueprint',
    'react-science',
    'react-cheminfo',
    'react',
    'vite',
  ]);
  expect(new Set(ABOUT.credits).size).toBe(ABOUT.credits.length);
});

test('the paper the manual credited is now the work the page cites', () => {
  expect(ABOUT.cite).toHaveLength(1);
  expect(ABOUT.cite?.[0]?.reference).toBe(PAPER);
  expect(PAPER.doi).toBe('10.1039/C5GC01022E');
  expect(PAPER.journalAbbreviation).toBe('Green Chem.');
  expect(PAPER.year).toBe(2015);
});

test('the visualizer view it replaces survives from the manual chapter', () => {
  const [approach, browser] = ABOUT.paragraphs ?? [];

  expect(approach).toContain('Vanderveen');
  expect(approach).toContain('cheminfo visualizer view');
  expect(browser).toContain('nothing is uploaded');
});

test('the record resolves against the shared registries', () => {
  const about = resolveAbout(ABOUT);

  expect(about.site.host).toBe('vcl.cheminfo.org');
  expect(about.license).toBe('MIT');
  expect(about.repository).toBe('https://github.com/cheminfo/vcl.cheminfo.org');
  expect(about.issues).toBe(
    'https://github.com/cheminfo/vcl.cheminfo.org/issues',
  );
  expect(about.credits.map((entry) => entry.name)).toStrictEqual([
    'OpenChemLib',
    'openchemlib-utils',
    'react-ocl',
    'react-mf',
    'Blueprint',
    'react-science',
    'react-cheminfo',
    'React',
    'Vite',
  ]);
});
