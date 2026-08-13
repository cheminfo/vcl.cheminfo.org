import { expect, test } from 'vitest';

import { GLOSSARY, splitGlossaryText } from '../data/glossary.ts';
import { HELP_SECTIONS } from '../data/helpSections.ts';

test('a marked paragraph splits into text and resolved terms', () => {
  const core = GLOSSARY.core;
  const rGroup = GLOSSARY['r group'];

  expect(
    splitGlossaryText(
      'The [[core]] holds [[R group]] atoms, a [[widget]] not.',
    ),
  ).toStrictEqual([
    { kind: 'text', text: 'The ' },
    { kind: 'term', text: 'core', entry: core },
    { kind: 'text', text: ' holds ' },
    { kind: 'term', text: 'R group', entry: rGroup },
    { kind: 'text', text: ' atoms, a ' },
    { kind: 'term', text: 'widget', entry: null },
    { kind: 'text', text: ' not.' },
  ]);
});

test('prose without a marker stays a single text segment', () => {
  expect(splitGlossaryText('No marker here at all.')).toStrictEqual([
    { kind: 'text', text: 'No marker here at all.' },
  ]);
});

test('a marker resolves whatever its casing', () => {
  expect(splitGlossaryText('[[OpenChemLib]]')).toStrictEqual([
    { kind: 'term', text: 'OpenChemLib', entry: GLOSSARY.openchemlib },
  ]);
  expect(splitGlossaryText('[[PSA]] and [[psa]]')).toStrictEqual([
    { kind: 'term', text: 'PSA', entry: GLOSSARY.psa },
    { kind: 'text', text: ' and ' },
    { kind: 'term', text: 'psa', entry: GLOSSARY.psa },
  ]);
});

test('every marker used by the help resolves to a glossary entry', () => {
  const missing: string[] = [];
  let marked = 0;
  for (const section of HELP_SECTIONS) {
    for (const paragraph of section.paragraphs) {
      for (const segment of splitGlossaryText(paragraph)) {
        if (segment.kind !== 'term') continue;
        marked++;
        if (segment.entry === null) missing.push(segment.text);
      }
    }
  }

  expect(missing).toStrictEqual([]);
  expect(marked).toBe(30);
});

test('the help is made of the nine expected sections', () => {
  const ids: string[] = [];
  for (const section of HELP_SECTIONS) ids.push(section.id);
  expect(ids).toStrictEqual([
    'what-this-tool-does',
    'draw-the-core',
    'draw-the-fragments',
    'generate-the-library',
    'explore-and-filter',
    'download',
    'predicted-properties',
    'limits-and-caveats',
    'credits',
  ]);
  expect(Object.keys(GLOSSARY)).toHaveLength(20);
});
