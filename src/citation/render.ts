import type { CitationSegment } from './segments.ts';

/**
 * Write the segments as they read in an email or a manuscript.
 * @param segments - Segments of the citation.
 * @returns The citation, with no markup at all.
 */
export function renderText(segments: readonly CitationSegment[]): string {
  let result = '';
  for (const segment of segments) {
    result += segment.kind === 'link' ? segment.href : segment.text;
  }
  return result;
}

/**
 * Write the segments as HTML, so a paste into Word or a web page keeps the
 * italics and the bold the style asks for.
 * @param segments - Segments of the citation.
 * @returns The citation as one line of HTML.
 */
export function renderHtml(segments: readonly CitationSegment[]): string {
  let result = '';
  for (const segment of segments) {
    switch (segment.kind) {
      case 'italic':
        result += `<em>${escapeHtml(segment.text)}</em>`;
        break;
      case 'bold':
        result += `<strong>${escapeHtml(segment.text)}</strong>`;
        break;
      case 'link':
        result += `<a href="${escapeHtml(segment.href)}">${escapeHtml(segment.text)}</a>`;
        break;
      case 'text':
        result += escapeHtml(segment.text);
        break;
      default:
        break;
    }
  }
  return result;
}

/**
 * Write the segments as Markdown, for a README or an issue.
 * @param segments - Segments of the citation.
 * @returns The citation as one line of Markdown.
 */
export function renderMarkdown(segments: readonly CitationSegment[]): string {
  let result = '';
  for (const segment of segments) {
    switch (segment.kind) {
      case 'italic':
        result += `*${segment.text}*`;
        break;
      case 'bold':
        result += `**${segment.text}**`;
        break;
      case 'link':
        result += `[${segment.text}](${segment.href})`;
        break;
      case 'text':
        result += segment.text;
        break;
      default:
        break;
    }
  }
  return result;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
