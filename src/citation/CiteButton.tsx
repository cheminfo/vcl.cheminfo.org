import type { PopoverNextProps } from '@blueprintjs/core';
import { PopoverNext } from '@blueprintjs/core';
import type { CSSProperties, ReactElement } from 'react';
import { Button } from 'react-science/ui';

import { CitationMenu } from './CitationMenu.tsx';
import type { Reference } from './reference.ts';

const BUTTON_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
};

export interface CiteButtonProps {
  /** The work the site asks to be cited. */
  reference: Reference;
  /**
   * Text of the button.
   * @default 'Cite'
   */
  label?: string;
  /**
   * Side the menu opens on.
   * @default 'bottom-end'
   */
  placement?: PopoverNextProps['placement'];
}

/**
 * The Cite entry of a site header: one button opening the article at its DOI,
 * the reference in the style a journal asks for, and the files a reference
 * manager imports.
 * @param props - The work being cited, and how the menu opens.
 * @returns The button and its menu.
 */
export function CiteButton(props: CiteButtonProps): ReactElement {
  const { reference, label = 'Cite', placement = 'bottom-end' } = props;

  return (
    <span className="citation-button" style={BUTTON_STYLE}>
      <PopoverNext
        placement={placement}
        content={<CitationMenu reference={reference} />}
      >
        <Button
          variant="minimal"
          icon="citation"
          endIcon="caret-down"
          text={label}
        />
      </PopoverNext>
    </span>
  );
}
