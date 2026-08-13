import { Tooltip } from '@blueprintjs/core';
import type { ReactElement, ReactNode } from 'react';

import type { GlossaryEntry } from '../../pages/help/data/glossary.ts';
import { splitGlossaryText } from '../../pages/help/data/glossary.ts';

export type { GlossarySegment } from '../../pages/help/data/glossary.ts';

export interface GlossaryTextProps {
  /** Prose that may contain [[term]] markers. */
  text: string;
}

// Matches the delay of the help tooltips, so hovering across a paragraph of
// marked terms never flickers.
const HOVER_OPEN_DELAY = 250;

/**
 * Render prose, turning every [[term]] marker into a hoverable definition. A
 * marker the glossary does not know becomes plain text, never brackets.
 * @param props - Prose to render.
 * @returns The prose, with every known term wrapped in a tooltip.
 */
export function GlossaryText(props: GlossaryTextProps): ReactElement {
  const children: ReactNode[] = [];
  let offset = 0;

  for (const segment of splitGlossaryText(props.text)) {
    const key = `${offset}:${segment.text}`;
    offset += segment.text.length;
    if (segment.kind === 'text' || segment.entry === null) {
      children.push(<span key={key}>{segment.text}</span>);
      continue;
    }
    children.push(
      <Tooltip
        key={key}
        hoverOpenDelay={HOVER_OPEN_DELAY}
        popoverClassName="help-tooltip glossary-tooltip"
        content={<GlossaryTooltipBody entry={segment.entry} />}
      >
        <span className="glossary-term">{segment.text}</span>
      </Tooltip>,
    );
  }

  return <>{children}</>;
}

function GlossaryTooltipBody(props: { entry: GlossaryEntry }): ReactElement {
  const { entry } = props;
  return (
    <div className="glossary-tooltip-body">
      <span className="glossary-tooltip-title">{entry.title}</span>
      <p>{entry.summary}</p>
      <ul>
        {entry.examples.map((example) => (
          <li key={example.code}>
            <code>{example.code}</code>
            <em>{example.note}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}
