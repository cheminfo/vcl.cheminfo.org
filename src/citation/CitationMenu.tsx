import type { IconName, Intent } from '@blueprintjs/core';
import { Menu, MenuDivider, MenuItem, Tooltip } from '@blueprintjs/core';
import { SvgLogoDoi } from 'cheminfo-font';
import type { CSSProperties, ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';

import { CitationPreview } from './CitationPreview.tsx';
import { copyCitation } from './clipboard.ts';
import { downloadCitation } from './download.ts';
import type { CitationDownload, CitationFormat } from './formats.ts';
import { CITATION_DOWNLOADS, CITATION_FORMATS } from './formats.ts';
import type { Reference } from './reference.ts';
import { doiUrl } from './reference.ts';
import type { CitationStyle } from './segments.ts';
import { CITATION_STYLES } from './segments.ts';

// How long the tick replaces the clipboard glyph of an entry after a copy.
const FEEDBACK_MS = 1500;

const MENU_STYLE: CSSProperties = { minWidth: 240 };
const DOI_ICON_STYLE: CSSProperties = { width: 16, height: 16 };
// An entry carrying its preview tooltip is also a popover target, and
// Blueprint's `.bp6-submenu .bp6-popover-target` then turns the row into a
// block, stacking the icon, the name and the journals. An inline rule outranks
// any selector, so the row survives wherever the entry is used.
const ENTRY_STYLE: CSSProperties = { display: 'flex' };
// Journal names are set in italic, as every one of these styles asks for.
const JOURNALS_STYLE: CSSProperties = { fontStyle: 'italic' };
// Long enough that running the pointer down the menu opens no preview.
const PREVIEW_OPEN_DELAY = 400;

interface CopyState {
  icon: IconName;
  intent: Intent;
  label: string;
}

export interface CitationMenuProps {
  /** The work being cited. */
  reference: Reference;
}

/**
 * What the Cite button opens: the article at its DOI, the reference copied in
 * the style a journal asks for, and the files a reference manager imports.
 * @param props - The work being cited.
 * @returns The citation menu.
 */
export function CitationMenu(props: CitationMenuProps): ReactElement {
  const { reference } = props;
  // Which entry showed feedback last, keyed `format` or `format:style`.
  const [copied, setCopied] = useState<string | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  const timeout = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeout.current !== null) window.clearTimeout(timeout.current);
    };
  }, []);

  function announce(key: string, failed: boolean): void {
    setCopied(key);
    setHasFailed(failed);
    if (timeout.current !== null) window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => {
      setCopied(null);
      setHasFailed(false);
    }, FEEDBACK_MS);
  }

  function copy(format: CitationFormat, style?: CitationStyle): void {
    const key = style === undefined ? format.id : `${format.id}:${style.id}`;
    copyCitation(reference, format.id, style?.id).then(
      () => {
        announce(key, false);
      },
      () => {
        // A denied clipboard permission is the usual cause, and the menu is the
        // only place the user can be told about it.
        announce(key, true);
      },
    );
  }

  function stateOf(key: string): CopyState | null {
    return copied === key ? feedback(hasFailed) : null;
  }

  return (
    <Menu className="citation-menu" style={MENU_STYLE}>
      <MenuItem
        icon={<SvgLogoDoi style={DOI_ICON_STYLE} />}
        text={`${reference.journalAbbreviation} ${reference.year}`}
        label={reference.doi}
        href={doiUrl(reference)}
        target="_blank"
        rel="noreferrer"
      />
      <MenuDivider title="Copy the reference as" />
      {CITATION_FORMATS.map((format) =>
        format.styled ? (
          <MenuItem
            key={format.id}
            icon="clipboard"
            text={format.label}
            label={format.hint}
          >
            {CITATION_STYLES.map((style) => (
              <CopyEntry
                key={style.id}
                reference={reference}
                format={format}
                style={style}
                state={stateOf(`${format.id}:${style.id}`)}
                onCopy={copy}
              />
            ))}
          </MenuItem>
        ) : (
          <CopyEntry
            key={format.id}
            reference={reference}
            format={format}
            state={stateOf(format.id)}
            onCopy={copy}
          />
        ),
      )}
      <MenuDivider title="Import into a reference manager" />
      {CITATION_DOWNLOADS.map((download) => (
        <DownloadEntry
          key={download.format}
          reference={reference}
          download={download}
        />
      ))}
    </Menu>
  );
}

interface CopyEntryProps {
  reference: Reference;
  format: CitationFormat;
  /** Style of the entry, when it sits in the submenu of a styled format. */
  style?: CitationStyle;
  /** Feedback of the last copy, while it is showing. */
  state: CopyState | null;
  onCopy: (format: CitationFormat, style?: CitationStyle) => void;
}

/** One entry that copies, previewing on hover what it puts on the clipboard. */
function CopyEntry(props: CopyEntryProps): ReactElement {
  const { reference, format, style, state, onCopy } = props;
  const entry = style ?? format;

  return (
    <PreviewTooltip reference={reference} format={format.id} style={style}>
      {(targetProps) => (
        <MenuItem
          {...targetProps}
          style={ENTRY_STYLE}
          icon={state?.icon ?? 'clipboard'}
          intent={state?.intent}
          text={entry.label}
          labelElement={
            // The hint of a style entry is a list of journals, in italic.
            style !== undefined && state === null ? (
              <span style={JOURNALS_STYLE}>{entry.hint}</span>
            ) : (
              (state?.label ?? entry.hint)
            )
          }
          shouldDismissPopover={false}
          onClick={() => {
            onCopy(format, style);
          }}
        />
      )}
    </PreviewTooltip>
  );
}

/** One entry saving the file a reference manager imports. */
function DownloadEntry(props: {
  reference: Reference;
  download: CitationDownload;
}): ReactElement {
  const { reference, download } = props;
  return (
    <PreviewTooltip reference={reference} format={download.format}>
      {(targetProps) => (
        <MenuItem
          {...targetProps}
          style={ENTRY_STYLE}
          icon="download"
          text={download.label}
          labelElement={download.hint}
          onClick={() => {
            downloadCitation(reference, download);
          }}
        />
      )}
    </PreviewTooltip>
  );
}

/** The hover preview of what an entry copies or saves. */
function PreviewTooltip(props: {
  reference: Reference;
  format: CitationFormat['id'];
  style?: CitationStyle;
  children: (targetProps: Record<string, unknown>) => ReactElement;
}): ReactElement {
  const { reference, format, style, children } = props;
  return (
    <Tooltip
      placement="left"
      popoverClassName="citation-tooltip"
      hoverOpenDelay={PREVIEW_OPEN_DELAY}
      content={
        <CitationPreview
          reference={reference}
          format={format}
          style={style?.id}
        />
      }
      renderTarget={({ isOpen, ...targetProps }) => children(targetProps)}
    />
  );
}

function feedback(failed: boolean): CopyState {
  if (failed) {
    return { icon: 'cross', intent: 'danger', label: 'copy failed' };
  }
  return { icon: 'tick', intent: 'success', label: 'copied' };
}
