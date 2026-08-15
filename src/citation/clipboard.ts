import type { CitationFormatId } from './formats.ts';
import { formatCitation } from './formats.ts';
import type { Reference } from './reference.ts';
import type { CitationStyleId } from './segments.ts';

/**
 * Put a reference on the clipboard. HTML goes on in both flavours, so a paste
 * into Word or Google Docs keeps the emphasis of the style while a plain text
 * editor still receives a readable line rather than the markup.
 * @param reference - Reference to copy.
 * @param format - Format to copy it in.
 * @param style - Journal style, for the formats that have one.
 * @returns Resolves once the clipboard holds the citation.
 */
export function copyCitation(
  reference: Reference,
  format: CitationFormatId,
  style?: CitationStyleId,
): Promise<void> {
  const value = formatCitation(reference, format, style);
  if (format !== 'html' || typeof ClipboardItem === 'undefined') {
    return navigator.clipboard.writeText(value);
  }
  return navigator.clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([value], { type: 'text/html' }),
      'text/plain': new Blob([formatCitation(reference, 'text', style)], {
        type: 'text/plain',
      }),
    }),
  ]);
}
