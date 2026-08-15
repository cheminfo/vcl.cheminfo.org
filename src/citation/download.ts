import type { CitationDownload } from './formats.ts';
import { citationFilename, formatCitation } from './formats.ts';
import type { Reference } from './reference.ts';

/**
 * Save the reference as the file a reference manager imports. The MIME type
 * is the one Zotero, Mendeley and EndNote recognise, so opening the saved
 * file hands it to whichever of them is installed.
 * @param reference - Reference to save.
 * @param download - File to write, from `CITATION_DOWNLOADS`.
 */
export function downloadCitation(
  reference: Reference,
  download: CitationDownload,
): void {
  const content = formatCitation(reference, download.format);
  const url = URL.createObjectURL(
    new Blob([content], { type: download.mimeType }),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = citationFilename(reference, download.extension);
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
