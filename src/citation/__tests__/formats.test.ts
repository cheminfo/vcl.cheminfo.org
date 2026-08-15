import { expect, test } from 'vitest';

import { PAPER } from '../../paper.ts';
import type { CitationFormatId } from '../formats.ts';
import { CITATION_FORMATS, formatCitation } from '../formats.ts';
import { doiUrl } from '../reference.ts';
import type { CitationStyleId } from '../segments.ts';
import { CITATION_STYLES, citationSegments } from '../segments.ts';

test('the plain text citation follows the ACS style by default', () => {
  expect(formatCitation(PAPER, 'text')).toBe(
    'Vanderveen, J. R.; Patiny, L.; Chalifoux, C. B.; Jessop, M. J.; Jessop, P. G. A virtual screening approach to identifying the greenest compound for a task: application to switchable-hydrophilicity solvents. Green Chem. 2015, 17, 5182–5188. https://doi.org/10.1039/C5GC01022E',
  );
});

test('the Nature style joins the last author with an ampersand', () => {
  expect(formatCitation(PAPER, 'text', 'nature')).toBe(
    'Vanderveen, J. R., Patiny, L., Chalifoux, C. B., Jessop, M. J. & Jessop, P. G. A virtual screening approach to identifying the greenest compound for a task: application to switchable-hydrophilicity solvents. Green Chem. 17, 5182–5188 (2015). https://doi.org/10.1039/C5GC01022E',
  );
});

test('the RSC style leads with the initials and drops the title', () => {
  expect(formatCitation(PAPER, 'text', 'rsc')).toBe(
    'J. R. Vanderveen, L. Patiny, C. B. Chalifoux, M. J. Jessop and P. G. Jessop, Green Chem., 2015, 17, 5182–5188. https://doi.org/10.1039/C5GC01022E',
  );
});

test('the Wiley style separates every author with a comma', () => {
  expect(formatCitation(PAPER, 'text', 'wiley')).toBe(
    'J. R. Vanderveen, L. Patiny, C. B. Chalifoux, M. J. Jessop, P. G. Jessop, Green Chem. 2015, 17, 5182–5188. https://doi.org/10.1039/C5GC01022E',
  );
});

test('the HTML citation carries the emphasis of the style and links the DOI', () => {
  expect(formatCitation(PAPER, 'html', 'acs')).toContain(
    '<em>Green Chem.</em> <strong>2015</strong>, <em>17</em>, 5182–5188. <a href="https://doi.org/10.1039/C5GC01022E">doi:10.1039/C5GC01022E</a>',
  );
  expect(formatCitation(PAPER, 'html', 'rsc')).toContain(
    '<em>Green Chem.</em>, 2015, <strong>17</strong>, 5182–5188.',
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

test('plain text is not offered, an HTML copy already carries it', () => {
  expect(
    CITATION_FORMATS.map((format) => [format.id, format.styled]),
  ).toStrictEqual([
    ['html', true],
    ['markdown', true],
    ['bibtex', false],
    ['ris', false],
    ['doi', false],
  ]);
});

test('every format of every style carries the DOI', () => {
  expect(CITATION_STYLES.map((style) => style.id)).toStrictEqual([
    'acs',
    'nature',
    'rsc',
    'wiley',
  ]);
  for (const format of CITATION_FORMATS) {
    for (const style of CITATION_STYLES) {
      expect(formatCitation(PAPER, format.id, style.id)).toContain(
        '10.1039/C5GC01022E',
      );
    }
  }
});

test('an unknown format or style is refused', () => {
  expect(() => formatCitation(PAPER, 'endnote' as CitationFormatId)).toThrow(
    'unknown citation format: endnote',
  );
  expect(() => citationSegments(PAPER, 'vancouver' as CitationStyleId)).toThrow(
    'unknown citation style: vancouver',
  );
});
