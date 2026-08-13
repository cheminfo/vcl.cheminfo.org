import { Callout, Card, Classes, H5, Tag } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { CanvasMoleculeEditor } from 'react-ocl';
import { Button } from 'react-science/ui';

import { HelpIcon } from '../../components/shared/HelpIcon.tsx';
import { HelpTooltip } from '../../components/shared/HelpTooltip.tsx';
import { helpTooltip } from '../../components/shared/helpContent.tsx';
import { coreInfo, usableFragments } from '../../state/data.ts';
import {
  preferences,
  resetLibrary,
  setCoreMolfile,
} from '../../state/preferences.ts';
import { normalizeCoreMolfile } from '../../vcl/core.ts';
import type { Fragment, RGroupKey } from '../../vcl/types.ts';
import { R_GROUP_KEYS } from '../../vcl/types.ts';

import { R_GROUP_INTENT } from './rGroupIntent.ts';
import {
  CORE_COPY_SMILES_HELP,
  CORE_PANEL_HELP,
  CORE_RESET_HELP,
  coreRGroupHelp,
} from './tooltips.ts';

const R_GROUP_HINT =
  'To mark a substitution point, hover the atom in the editor, type R1, R2, R3 or R4, then press Enter. Typing a bare R works too: it takes the lowest number still free.';
// The OpenChemLib editor lays its tool palette out down the left edge and
// crams the glyphs together when the canvas is shorter than this.
const EDITOR_HEIGHT = 360;
const COPY_FEEDBACK_MS = 2000;

interface EditorSource {
  revision: number;
  molfile: string;
}

/**
 * First step of the builder: draw the core structure and mark its R groups.
 * @returns The core card.
 */
export function CorePanel(): ReactElement {
  useSignals();
  const info = coreInfo.value;
  const fragmentCounts = countFragmentsByRGroup(usableFragments.value);

  const [editorSource, setEditorSource] = useState<EditorSource>(() => ({
    revision: 0,
    molfile: preferences.library.coreMolfile.peek(),
  }));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => {
      setCopied(false);
    }, COPY_FEEDBACK_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [copied]);

  function handleReset(): void {
    resetLibrary();
    const molfile = preferences.library.coreMolfile.peek();
    setEditorSource((source) => ({ revision: source.revision + 1, molfile }));
  }

  function handleCopySmiles(): void {
    const clipboard: Clipboard | undefined = navigator.clipboard;
    if (clipboard === undefined || info.smilesWithR === '') return;
    void clipboard.writeText(info.smilesWithR).then(
      () => {
        setCopied(true);
      },
      () => {
        setCopied(false);
      },
    );
  }

  return (
    <Card className="core-panel">
      <div className="panel-heading">
        <H5>
          <span className="help-label">
            1. Core structure
            <HelpIcon help={CORE_PANEL_HELP} />
          </span>
        </H5>
        <div className="panel-actions">
          <Button
            variant="minimal"
            icon="reset"
            text="Reset to default"
            tooltipProps={helpTooltip(CORE_RESET_HELP)}
            onClick={handleReset}
          />
          <Button
            variant="minimal"
            icon={copied ? 'tick' : 'clipboard'}
            intent={copied ? 'success' : 'none'}
            text="Copy SMILES"
            disabled={info.smilesWithR === ''}
            tooltipProps={helpTooltip(CORE_COPY_SMILES_HELP)}
            onClick={handleCopySmiles}
          />
        </div>
      </div>

      <div className="core-editor">
        <CanvasMoleculeEditor
          key={editorSource.revision}
          inputFormat="molfile"
          inputValue={editorSource.molfile}
          width="100%"
          height={EDITOR_HEIGHT}
          onChange={(event) => {
            const drawn = event.getMolfile();
            const molfile = normalizeCoreMolfile(drawn);
            setCoreMolfile(molfile);
            // Reloading the editor is what shows the user the number their `R`
            // was given, so only do it when an atom really had to be numbered.
            if (molfile !== drawn) {
              setEditorSource((source) => ({
                revision: source.revision + 1,
                molfile,
              }));
            }
          }}
        />
      </div>

      <div className="panel-hint">{R_GROUP_HINT}</div>

      <div className="core-summary">
        {info.rGroups.map((key) => {
          const count = fragmentCounts[key];
          return (
            <HelpTooltip key={key} help={coreRGroupHelp(key, count)}>
              <Tag
                intent={R_GROUP_INTENT[key]}
                minimal={count === 0}
                icon={count === 0 ? 'warning-sign' : undefined}
              >
                {`${key} · ${count} ${count === 1 ? 'fragment' : 'fragments'}`}
              </Tag>
            </HelpTooltip>
          );
        })}
        <span className={Classes.TEXT_MUTED}>{`${info.atomCount} atoms`}</span>
      </div>

      {info.error !== null && (
        <Callout intent="warning" compact>
          {info.error}
        </Callout>
      )}
    </Card>
  );
}

function countFragmentsByRGroup(
  fragments: readonly Fragment[],
): Record<RGroupKey, number> {
  const counts: Record<RGroupKey, number> = { R1: 0, R2: 0, R3: 0, R4: 0 };
  for (const fragment of fragments) {
    for (const key of R_GROUP_KEYS) {
      if (fragment.targets[key]) counts[key]++;
    }
  }
  return counts;
}
