import type { ReactElement } from 'react';

import { CorePanel } from './CorePanel.tsx';
import { FragmentsPanel } from './FragmentsPanel.tsx';
import { GeneratePanel } from './GeneratePanel.tsx';
import { ResultsPanel } from './ResultsPanel.tsx';

/**
 * The builder: the core drawing and the fragment list side by side, then the
 * generation bar and the results, both full width.
 * @returns The four numbered steps of the builder, laid out on the CSS grid.
 */
export function BuilderPage(): ReactElement {
  return (
    <div className="builder">
      <CorePanel />
      <FragmentsPanel />
      <GeneratePanel />
      <ResultsPanel />
    </div>
  );
}
