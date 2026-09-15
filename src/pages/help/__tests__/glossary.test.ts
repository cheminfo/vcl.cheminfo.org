import { parseGlossaryMarkers } from 'react-cheminfo/core';
import { expect, test } from 'vitest';

import { GLOSSARY } from '../data/glossary.ts';
import { HELP_SECTIONS } from '../data/helpSections.ts';

test('every marker used by the help resolves to a glossary entry', () => {
  const missing: string[] = [];
  let marked = 0;
  for (const section of HELP_SECTIONS) {
    for (const paragraph of section.paragraphs) {
      for (const segment of parseGlossaryMarkers(paragraph)) {
        if (segment.kind !== 'term') continue;
        marked++;
        // `parseGlossaryMarkers` already lowercases the term, which is how the
        // glossary is keyed.
        if (!Object.hasOwn(GLOSSARY, segment.term)) missing.push(segment.text);
      }
    }
  }

  expect(missing).toStrictEqual([]);
  expect(marked).toBe(29);
});

test('the help is made of the eight expected sections', () => {
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
  ]);
  expect(Object.keys(GLOSSARY)).toHaveLength(20);
});
