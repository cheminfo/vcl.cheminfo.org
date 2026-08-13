import type { IconName, Intent } from '@blueprintjs/core';
import {
  AnchorButton,
  Menu,
  MenuDivider,
  MenuItem,
  PopoverNext,
} from '@blueprintjs/core';
import { SvgLogoDoi } from 'cheminfo-font';
import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Button } from 'react-science/ui';

import type { CitationFormatId } from '../../citation/formats.ts';
import { CITATION_FORMATS, formatCitation } from '../../citation/formats.ts';
import { PAPER, doiUrl } from '../../citation/reference.ts';

import { HelpTooltip } from './HelpTooltip.tsx';
import type { HelpContent } from './helpContent.tsx';
import { helpTooltip } from './helpContent.tsx';

const PAPER_HELP: HelpContent = {
  title: 'Green Chem. 2015',
  description:
    'Vanderveen, Patiny, Chalifoux, Jessop and Jessop, "A virtual screening approach to identifying the greenest compound for a task: application to switchable-hydrophilicity solvents". The screening this tool performs.',
  link: doiUrl(PAPER),
};

const CITE_HELP: HelpContent = {
  title: 'Cite this work',
  description:
    'Copy the reference of the article in the format your manuscript, your README or your reference manager expects.',
  details: CITATION_FORMATS.map((format) => `${format.label}: ${format.hint}`),
};

// How long the tick replaces the clipboard glyph of an entry after a copy.
const FEEDBACK_MS = 1500;

/**
 * The article the tool implements: a link opening it at its DOI, and a menu
 * copying its reference in any of the citation formats.
 * @returns The reference block of the header.
 */
export function PaperReference(): ReactElement {
  const [copied, setCopied] = useState<CitationFormatId | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  const timeout = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeout.current !== null) window.clearTimeout(timeout.current);
    };
  }, []);

  function announce(format: CitationFormatId, failed: boolean): void {
    setCopied(format);
    setHasFailed(failed);
    if (timeout.current !== null) window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => {
      setCopied(null);
      setHasFailed(false);
    }, FEEDBACK_MS);
  }

  function copy(format: CitationFormatId): void {
    navigator.clipboard.writeText(formatCitation(PAPER, format)).then(
      () => {
        announce(format, false);
      },
      () => {
        // A denied clipboard permission is the usual cause, and the menu is the
        // only place the user can be told about it.
        announce(format, true);
      },
    );
  }

  return (
    <span className="paper-reference">
      <HelpTooltip help={PAPER_HELP} placement="bottom-end">
        <AnchorButton
          href={doiUrl(PAPER)}
          target="_blank"
          rel="noreferrer"
          variant="minimal"
          icon={<SvgLogoDoi className="doi-icon" />}
          text="Green Chem. 2015"
        />
      </HelpTooltip>
      <PopoverNext
        placement="bottom-end"
        content={
          <Menu className="citation-menu">
            <MenuDivider title="Copy the reference as" />
            {CITATION_FORMATS.map((format) => {
              const state = copied === format.id ? feedback(hasFailed) : null;
              return (
                <MenuItem
                  key={format.id}
                  icon={state?.icon ?? 'clipboard'}
                  intent={state?.intent}
                  text={format.label}
                  label={state?.label ?? format.hint}
                  shouldDismissPopover={false}
                  onClick={() => {
                    copy(format.id);
                  }}
                />
              );
            })}
            <MenuDivider />
            <MenuItem
              icon="share"
              text="Open the article"
              href={doiUrl(PAPER)}
              target="_blank"
              rel="noreferrer"
            />
          </Menu>
        }
      >
        <Button
          variant="minimal"
          icon="citation"
          endIcon="caret-down"
          text="Cite"
          tooltipProps={helpTooltip(CITE_HELP)}
        />
      </PopoverNext>
    </span>
  );
}

function feedback(failed: boolean): {
  icon: IconName;
  intent: Intent;
  label: string;
} {
  if (failed) {
    return { icon: 'cross', intent: 'danger', label: 'copy failed' };
  }
  return { icon: 'tick', intent: 'success', label: 'copied' };
}
