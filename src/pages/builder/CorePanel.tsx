import { Callout, Card, Classes, H5, Tag } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { pluralize } from 'react-cheminfo/core';
import { StructureEditor } from 'react-cheminfo/structure';
import { useCopyToClipboard } from 'react-cheminfo/ui';
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
// The shortest the drawing area is ever drawn; the editor raises it further
// when its own tool palette needs more room than that.
const EDITOR_MIN_HEIGHT = 360;
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
  const { copied, copy } = useCopyToClipboard(COPY_FEEDBACK_MS);

  function handleReset(): void {
    resetLibrary();
    const molfile = preferences.library.coreMolfile.peek();
    setEditorSource((source) => ({ revision: source.revision + 1, molfile }));
  }

  function handleCopySmiles(): void {
    if (info.smilesWithR === '') return;
    void copy(info.smilesWithR);
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

      <StructureEditor
        inputFormat="molfile"
        value={editorSource.molfile}
        revision={editorSource.revision}
        minHeight={EDITOR_MIN_HEIGHT}
        debounce={0}
        onChange={(change) => {
          const molfile = normalizeCoreMolfile(change.molfile);
          setCoreMolfile(molfile);
          // Reloading the editor is what shows the user the number their `R`
          // was given, so only do it when an atom really had to be numbered.
          if (molfile !== change.molfile) {
            setEditorSource((source) => ({
              revision: source.revision + 1,
              molfile,
            }));
          }
        }}
      />

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
                {`${key} · ${count} ${pluralize(count, 'fragment')}`}
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
