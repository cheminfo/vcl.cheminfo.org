import type { Reference } from './reference.ts';
import { doiUrl } from './reference.ts';
import { renderHtml, renderMarkdown, renderText } from './render.ts';
import type { CitationStyleId } from './segments.ts';
import { citationSegments } from './segments.ts';

/** The formats the reference can be copied in. */
export type CitationFormatId =
  'text' | 'html' | 'markdown' | 'bibtex' | 'ris' | 'doi';

/** One entry of the copy menu. */
export interface CitationFormat {
  id: CitationFormatId;
  /** Name of the format. */
  label: string;
  /** Where that format is pasted, shown on the right of the entry. */
  hint: string;
  /**
   * Whether the format is written differently by each journal style, and so
   * opens the submenu of styles rather than copying straight away.
   */
  styled: boolean;
}

/**
 * Every format offered, in the order the menu lists them. Plain text is not
 * one of them: an HTML copy carries it as its second flavour, so a paste into
 * a plain editor already gives the unmarked line.
 */
export const CITATION_FORMATS = [
  { id: 'html', label: 'HTML', hint: 'Word, Docs, email', styled: true },
  { id: 'markdown', label: 'Markdown', hint: 'README, issue', styled: true },
  { id: 'bibtex', label: 'BibTeX', hint: 'LaTeX', styled: false },
  { id: 'ris', label: 'RIS', hint: 'EndNote, Zotero', styled: false },
  { id: 'doi', label: 'DOI link', hint: 'URL', styled: false },
] as const satisfies readonly CitationFormat[];

/** The style a format that has one is written in unless another is picked. */
export const DEFAULT_CITATION_STYLE: CitationStyleId = 'acs';

/** One entry of the download menu: a file a reference manager imports. */
export interface CitationDownload {
  format: CitationFormatId;
  label: string;
  hint: string;
  extension: string;
  mimeType: string;
}

/**
 * The files offered for download. Zotero, Mendeley and EndNote all import
 * both, and their connectors recognise the MIME types below on their own.
 */
export const CITATION_DOWNLOADS = [
  {
    format: 'ris',
    label: 'RIS file',
    hint: 'Zotero, Mendeley, EndNote',
    extension: 'ris',
    mimeType: 'application/x-research-info-systems',
  },
  {
    format: 'bibtex',
    label: 'BibTeX file',
    hint: 'JabRef, Overleaf',
    extension: 'bib',
    mimeType: 'application/x-bibtex',
  },
] as const satisfies readonly CitationDownload[];

/**
 * Name the saved file carries, e.g. `Vanderveen2015.ris`.
 * @param reference - Reference the file holds.
 * @param extension - Extension of the file, without its dot.
 * @returns The file name.
 */
export function citationFilename(
  reference: Reference,
  extension: string,
): string {
  return `${bibTeXKey(reference)}.${extension}`;
}

/**
 * Render a reference in one of the citation formats.
 * @param reference - Reference to render.
 * @param format - Format to render it in.
 * @param style - Journal style, for the formats that have one.
 * @returns The citation, ready to be copied to the clipboard.
 */
export function formatCitation(
  reference: Reference,
  format: CitationFormatId,
  style: CitationStyleId = DEFAULT_CITATION_STYLE,
): string {
  switch (format) {
    case 'text':
      return renderText(citationSegments(reference, style));
    case 'html':
      return renderHtml(citationSegments(reference, style));
    case 'markdown':
      return renderMarkdown(citationSegments(reference, style));
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

function bibTeXKey(reference: Reference): string {
  const first = reference.authors[0];
  const family = first === undefined ? 'reference' : first.family;
  return `${family.replaceAll(/[^a-zA-Z]/g, '')}${reference.year}`;
}
