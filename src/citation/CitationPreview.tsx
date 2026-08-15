import type { CSSProperties, ReactElement } from 'react';

import type { CitationFormatId } from './formats.ts';
import { formatCitation } from './formats.ts';
import type { Reference } from './reference.ts';
import type { CitationStyleId } from './segments.ts';
import { citationSegments } from './segments.ts';

// A BibTeX entry and a one-line citation share this box, so the text wraps and
// the box never grows past what a tooltip can hold. The height is the last
// resort, for a window too short to show an entry whole.
const PREVIEW_STYLE: CSSProperties = {
  maxWidth: 440,
  maxHeight: '70vh',
  overflow: 'auto',
  margin: 0,
  color: '#e5e8eb',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 11.5,
  lineHeight: 1.45,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
};
// HTML is previewed as it reads once pasted, so it takes the reading font.
const RICH_STYLE: CSSProperties = {
  maxWidth: 440,
  color: '#e5e8eb',
  fontSize: 12,
  lineHeight: 1.45,
};
const LINK_STYLE: CSSProperties = { color: '#8abbff' };

export interface CitationPreviewProps {
  reference: Reference;
  format: CitationFormatId;
  /** Journal style, for the formats that have one. */
  style?: CitationStyleId;
}

/**
 * What a copy of the reference puts on the clipboard, as it will read once
 * pasted: the emphasis of the style for HTML, the source itself otherwise.
 * @param props - Reference, format and style to preview.
 * @returns The body of the preview tooltip.
 */
export function CitationPreview(props: CitationPreviewProps): ReactElement {
  const { reference, format, style } = props;

  if (format === 'html' && style !== undefined) {
    return (
      <div className="citation-preview" style={RICH_STYLE}>
        {citationSegments(reference, style).map((segment, index) => (
          // The segments of one citation are a fixed list, never reordered.
          // eslint-disable-next-line react/no-array-index-key
          <Segment key={index} segment={segment} />
        ))}
      </div>
    );
  }

  return (
    <pre className="citation-preview" style={PREVIEW_STYLE}>
      {formatCitation(reference, format, style)}
    </pre>
  );
}

function Segment(props: {
  segment: ReturnType<typeof citationSegments>[number];
}): ReactElement {
  const { segment } = props;
  switch (segment.kind) {
    case 'italic':
      return <em>{segment.text}</em>;
    case 'bold':
      return <strong>{segment.text}</strong>;
    case 'link':
      return <span style={LINK_STYLE}>{segment.text}</span>;
    case 'text':
      return <span>{segment.text}</span>;
    default:
      return <span />;
  }
}
