import type { Reference } from './reference.ts';
import { doiUrl } from './reference.ts';

/** One piece of a written reference, with the emphasis its style asks for. */
export type CitationSegment =
  | { kind: 'text' | 'italic' | 'bold'; text: string }
  | { kind: 'link'; text: string; href: string };

/** The journal styles the reference can be written in. */
export type CitationStyleId = 'acs' | 'nature' | 'rsc' | 'wiley';

/** One entry of the style submenu. */
export interface CitationStyle {
  id: CitationStyleId;
  /** Name of the style. */
  label: string;
  /** Journals that ask for it, shown on the right of the entry. */
  hint: string;
}

/** Every style offered, in the order the menu lists them. */
export const CITATION_STYLES = [
  { id: 'acs', label: 'ACS', hint: 'JACS, Org. Lett.' },
  { id: 'nature', label: 'Nature', hint: 'Nature, Nat. Chem.' },
  { id: 'rsc', label: 'RSC', hint: 'Chem. Sci., Green Chem.' },
  { id: 'wiley', label: 'Wiley', hint: 'Angew. Chem., Chem. Eur. J.' },
] as const satisfies readonly CitationStyle[];

/**
 * Write a reference in one journal style, as the pieces every output format
 * then renders with its own emphasis.
 * @param reference - Reference to write.
 * @param style - Style to write it in.
 * @returns The segments of the citation, in reading order.
 */
export function citationSegments(
  reference: Reference,
  style: CitationStyleId,
): CitationSegment[] {
  switch (style) {
    case 'acs':
      return acs(reference);
    case 'nature':
      return nature(reference);
    case 'rsc':
      return rsc(reference);
    case 'wiley':
      return wiley(reference);
    default:
      throw new Error(`unknown citation style: ${String(style)}`);
  }
}

function acs(reference: Reference): CitationSegment[] {
  const { title, journalAbbreviation, year, volume } = reference;
  return [
    text(`${familyFirst(reference, '; ')} ${title}. `),
    italic(journalAbbreviation),
    text(' '),
    bold(String(year)),
    text(', '),
    italic(volume),
    text(`, ${pageRange(reference)}. `),
    doiLink(reference),
  ];
}

function nature(reference: Reference): CitationSegment[] {
  const { title, journalAbbreviation, year, volume } = reference;
  return [
    text(`${familyFirstAmpersand(reference)} ${title}. `),
    italic(journalAbbreviation),
    text(' '),
    bold(volume),
    text(`, ${pageRange(reference)} (${year}). `),
    doiLink(reference),
  ];
}

function rsc(reference: Reference): CitationSegment[] {
  const { journalAbbreviation, year, volume } = reference;
  return [
    text(`${initialsFirst(reference, ' and ')}, `),
    italic(journalAbbreviation),
    text(`, ${year}, `),
    bold(volume),
    text(`, ${pageRange(reference)}. `),
    doiLink(reference),
  ];
}

function wiley(reference: Reference): CitationSegment[] {
  const { journalAbbreviation, year, volume } = reference;
  return [
    text(`${initialsFirst(reference, ', ')}, `),
    italic(journalAbbreviation),
    text(' '),
    bold(String(year)),
    text(', '),
    italic(volume),
    text(`, ${pageRange(reference)}. `),
    doiLink(reference),
  ];
}

function text(value: string): CitationSegment {
  return { kind: 'text', text: value };
}

function italic(value: string): CitationSegment {
  return { kind: 'italic', text: value };
}

function bold(value: string): CitationSegment {
  return { kind: 'bold', text: value };
}

function doiLink(reference: Reference): CitationSegment {
  return {
    kind: 'link',
    text: `doi:${reference.doi}`,
    href: doiUrl(reference),
  };
}

/** `Vanderveen, J. R.; Patiny, L.` — the family name leads. */
function familyFirst(reference: Reference, separator: string): string {
  return reference.authors
    .map((author) => `${author.family}, ${author.given}`)
    .join(separator);
}

/** The same, with the last author introduced by an ampersand. */
function familyFirstAmpersand(reference: Reference): string {
  const names = reference.authors.map(
    (author) => `${author.family}, ${author.given}`,
  );
  const last = names.at(-1);
  if (names.length < 2 || last === undefined) return names.join(', ');
  return `${names.slice(0, -1).join(', ')} & ${last}`;
}

/** `J. R. Vanderveen, L. Patiny` — the initials lead. */
function initialsFirst(reference: Reference, lastSeparator: string): string {
  const names = reference.authors.map(
    (author) => `${author.given} ${author.family}`,
  );
  const last = names.at(-1);
  if (names.length < 2 || last === undefined) return names.join(', ');
  return `${names.slice(0, -1).join(', ')}${lastSeparator}${last}`;
}

function pageRange(reference: Reference): string {
  // En dash: what every style asks for in a page range.
  return `${reference.firstPage}–${reference.lastPage}`;
}
