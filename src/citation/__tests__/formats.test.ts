import { expect, test } from 'vitest';

import type { CitationFormatId } from '../formats.ts';
import { CITATION_FORMATS, formatCitation } from '../formats.ts';
import { PAPER, doiUrl } from '../reference.ts';

test('the plain text citation follows the ACS style', () => {
  expect(formatCitation(PAPER, 'text')).toBe(
    'Vanderveen, J. R.; Patiny, L.; Chalifoux, C. B.; Jessop, M. J.; Jessop, P. G. A virtual screening approach to identifying the greenest compound for a task: application to switchable-hydrophilicity solvents. Green Chem. 2015, 17, 5182–5188. https://doi.org/10.1039/C5GC01022E',
  );
});

test('the markdown citation links the DOI', () => {
  expect(formatCitation(PAPER, 'markdown')).toBe(
    'Vanderveen, J. R.; Patiny, L.; Chalifoux, C. B.; Jessop, M. J.; Jessop, P. G. A virtual screening approach to identifying the greenest compound for a task: application to switchable-hydrophilicity solvents. *Green Chem.* **2015**, *17*, 5182–5188. [doi:10.1039/C5GC01022E](https://doi.org/10.1039/C5GC01022E)',
  );
});

test('the BibTeX entry is keyed on the first author and the year', () => {
  expect(formatCitation(PAPER, 'bibtex')).toBe(
    `@article{Vanderveen2015,
  author = {Vanderveen, J. R. and Patiny, L. and Chalifoux, C. B. and Jessop, M. J. and Jessop, P. G.},
  title = {A virtual screening approach to identifying the greenest compound for a task: application to switchable-hydrophilicity solvents},
  journal = {Green Chemistry},
  year = {2015},
  volume = {17},
  number = {12},
  pages = {5182--5188},
  publisher = {Royal Society of Chemistry},
  doi = {10.1039/C5GC01022E},
  url = {https://doi.org/10.1039/C5GC01022E},
}`,
  );
});

test('the RIS entry lists one AU line per author and ends with ER', () => {
  const ris = formatCitation(PAPER, 'ris');
  const lines = ris.split('\n');

  expect(lines[0]).toBe('TY  - JOUR');
  expect(lines.filter((line) => line.startsWith('AU  - '))).toStrictEqual([
    'AU  - Vanderveen, J. R.',
    'AU  - Patiny, L.',
    'AU  - Chalifoux, C. B.',
    'AU  - Jessop, M. J.',
    'AU  - Jessop, P. G.',
  ]);
  expect(lines).toContain('JO  - Green Chemistry');
  expect(lines).toContain('SP  - 5182');
  expect(lines).toContain('EP  - 5188');
  expect(lines).toContain('DO  - 10.1039/C5GC01022E');
  expect(lines).toContain('UR  - https://doi.org/10.1039/C5GC01022E');
  expect(lines.at(-1)).toBe('ER  - ');
});

test('the DOI format is the resolvable URL', () => {
  expect(formatCitation(PAPER, 'doi')).toBe(
    'https://doi.org/10.1039/C5GC01022E',
  );
  expect(doiUrl(PAPER)).toBe('https://doi.org/10.1039/C5GC01022E');
});

test('every offered format carries the DOI', () => {
  expect(CITATION_FORMATS.map((format) => format.id)).toStrictEqual([
    'text',
    'markdown',
    'bibtex',
    'ris',
    'doi',
  ]);
  for (const format of CITATION_FORMATS) {
    expect(formatCitation(PAPER, format.id)).toContain('10.1039/C5GC01022E');
  }
});

test('an unknown format is refused', () => {
  expect(() => formatCitation(PAPER, 'endnote' as CitationFormatId)).toThrow(
    'unknown citation format: endnote',
  );
});
