import { Callout, Card, H5, ProgressBar } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { formatInteger } from 'react-cheminfo/core';
import { Button } from 'react-science/ui';

import { HelpIcon } from '../../components/shared/HelpIcon.tsx';
import { HelpTooltip } from '../../components/shared/HelpTooltip.tsx';
import { helpTooltip } from '../../components/shared/helpContent.tsx';
import {
  cancelGenerationAction,
  combinationCount,
  data,
  generationBlocker,
  runGenerationAction,
} from '../../state/data.ts';

import {
  COMBINATION_COUNT_HELP,
  GENERATE_CANCEL_HELP,
  GENERATE_PANEL_HELP,
  generateHelp,
} from './tooltips.ts';

const LARGE_LIBRARY = 50_000;

/**
 * Step three: how many combinations the current library expands to, the button
 * that enumerates them, and the progress of the run in flight.
 * @returns The full width generation bar.
 */
export function GeneratePanel(): ReactElement {
  useSignals();

  const count = combinationCount.value;
  const blocker = generationBlocker.value;
  const running = data.status.value === 'running';
  const moleculeCount = data.molecules.value.length;
  const durationMs = data.durationMs.value;
  const done = data.progressDone.value;
  const total = data.progressTotal.value;
  const error = data.error.value;

  return (
    <Card className="generate-panel">
      <div className="panel-heading">
        <H5>
          <span className="help-label">
            3. Generate
            <HelpIcon help={GENERATE_PANEL_HELP} />
          </span>
        </H5>
      </div>

      <div className="generate-bar">
        <Button
          intent="primary"
          icon="play"
          text="Generate library"
          loading={running}
          disabled={blocker !== null || running}
          tooltipProps={helpTooltip(generateHelp(blocker, count))}
          onClick={() => {
            void runGenerationAction();
          }}
        />
        <div className="generate-status">
          <HelpTooltip help={COMBINATION_COUNT_HELP}>
            <span>
              <strong>{formatInteger(count)}</strong> combinations to enumerate
            </span>
          </HelpTooltip>
          {moleculeCount > 0 ? (
            <span className="generate-outcome">
              <strong>{formatInteger(moleculeCount)}</strong> distinct molecules
              {durationMs === null
                ? null
                : ` in ${formatInteger(Math.round(durationMs))} ms`}
            </span>
          ) : null}
        </div>
      </div>

      {running ? (
        <div className="generate-progress">
          <ProgressBar
            intent="primary"
            value={total === 0 ? undefined : done / total}
          />
          <span className="generate-progress-count">
            {formatInteger(done)} / {formatInteger(total)}
            {total === 0 ? null : ` (${Math.floor((done / total) * 100)}%)`}
          </span>
          <Button
            text="Cancel"
            icon="cross"
            tooltipProps={helpTooltip(GENERATE_CANCEL_HELP)}
            onClick={cancelGenerationAction}
          />
        </div>
      ) : null}

      {blocker === null ? null : (
        <Callout intent="warning" compact>
          {blocker}
        </Callout>
      )}

      {error === null ? null : (
        <Callout intent="danger" compact title="The generation failed">
          {error}
        </Callout>
      )}

      {count > LARGE_LIBRARY ? (
        <Callout intent="warning" compact>
          This will enumerate {formatInteger(count)} combinations and may take a
          while.
        </Callout>
      ) : null}
    </Card>
  );
}
