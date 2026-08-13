import type { Reference } from './reference.ts';
import { doiUrl } from './reference.ts';

/** The citation formats the reference can be copied in. */
export type CitationFormatId = 'text' | 'markdown' | 'bibtex' | 'ris' | 'doi';

/** One entry of the copy menu. */
export interface CitationFormat {
  id: CitationFormatId;
  /** Name of the format. */
  label: string;
  /** Where that format is pasted, shown on the right of the entry. */
  hint: string;
}

/** Every format offered, in the order the menu lists them. */
export const CITATION_FORMATS = [
  { id: 'text', label: 'Plain text', hint: 'ACS style' },
  { id: 'markdown', label: 'Markdown', hint: 'README, issue' },
  { id: 'bibtex', label: 'BibTeX', hint: 'LaTeX' },
  { id: 'ris', label: 'RIS', hint: 'EndNote, Zotero' },
  { id: 'doi', label: 'DOI link', hint: 'URL' },
] as const satisfies readonly CitationFormat[];

/**
 * Render a reference in one of the citation formats.
 * @param reference - Reference to render.
 * @param format - Format to render it in.
 * @returns The citation, ready to be copied to the clipboard.
 */
export function formatCitation(
  reference: Reference,
  format: CitationFormatId,
): string {
  switch (format) {
    case 'text':
      return formatText(reference);
    case 'markdown':
      return formatMarkdown(reference);
    case 'bibtex':
      return formatBibTeX(reference);
    case 'ris':
      return formatRis(reference);
    case 'doi':
      return doiUrl(reference);
    default:
      throw new Error(`unknown citation format: ${String(format)}`);
  }
}

function formatText(reference: Reference): string {
  const { title, journalAbbreviation, year, volume } = reference;
  return [
    `${authorList(reference, '; ')} ${title}.`,
    `${journalAbbreviation} ${year}, ${volume}, ${pageRange(reference)}.`,
    doiUrl(reference),
  ].join(' ');
}

function formatMarkdown(reference: Reference): string {
  const { title, journalAbbreviation, year, volume, doi } = reference;
  return [
    `${authorList(reference, '; ')} ${title}.`,
    `*${journalAbbreviation}* **${year}**, *${volume}*, ${pageRange(reference)}.`,
    `[doi:${doi}](${doiUrl(reference)})`,
  ].join(' ');
}

function formatBibTeX(reference: Reference): string {
  const { title, journal, year, volume, issue, publisher, doi } = reference;
  const { firstPage, lastPage } = reference;
  const fields: Array<[string, string]> = [
    ['author', authorList(reference, ' and ')],
    ['title', title],
    ['journal', journal],
    ['year', String(year)],
    ['volume', volume],
    ['number', issue],
    ['pages', `${firstPage}--${lastPage}`],
    ['publisher', publisher],
    ['doi', doi],
    ['url', doiUrl(reference)],
  ];
  const body = fields
    .map(([name, value]) => `  ${name} = {${value}},`)
    .join('\n');
  return `@article{${bibTeXKey(reference)},\n${body}\n}`;
}

function formatRis(reference: Reference): string {
  const { title, journal, year, volume, issue, publisher, doi } = reference;
  const { authors, firstPage, lastPage } = reference;
  const lines: Array<[string, string]> = [
    ['TY', 'JOUR'],
    ...authors.map((author): [string, string] => [
      'AU',
      `${author.family}, ${author.given}`,
    ]),
    ['TI', title],
    ['JO', journal],
    ['PY', String(year)],
    ['VL', volume],
    ['IS', issue],
    ['SP', firstPage],
    ['EP', lastPage],
    ['PB', publisher],
    ['DO', doi],
    ['UR', doiUrl(reference)],
    ['ER', ''],
  ];
  return lines.map(([tag, value]) => `${tag}  - ${value}`).join('\n');
}

function authorList(reference: Reference, separator: string): string {
  return reference.authors
    .map((author) => `${author.family}, ${author.given}`)
    .join(separator);
}

function pageRange(reference: Reference): string {
  // En dash: what every style asks for in a page range.
  return `${reference.firstPage}–${reference.lastPage}`;
}

function bibTeXKey(reference: Reference): string {
  const first = reference.authors[0];
  const family = first === undefined ? 'reference' : first.family;
  return `${family.replaceAll(/[^a-zA-Z]/g, '')}${reference.year}`;
}
