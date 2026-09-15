import { ButtonGroup, Classes } from '@blueprintjs/core';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { downloadText, formatInteger, pluralize } from 'react-cheminfo/core';
import { Button } from 'react-science/ui';

import { HelpTooltip } from '../../components/shared/HelpTooltip.tsx';
import type { HelpContent } from '../../components/shared/helpContent.tsx';
import { helpTooltip } from '../../components/shared/helpContent.tsx';
import { filteredMolecules } from '../../state/data.ts';
import { toCSV, toSDF, toSmilesList } from '../../vcl/export.ts';
import type { GeneratedMolecule } from '../../vcl/types.ts';
import { helpLink } from '../help/data/helpSections.ts';

/**
 * Save the molecules kept by the current brushes as SDF, SMILES or CSV.
 * @returns The download button group.
 */
export function DownloadBar(): ReactElement {
  useSignals();

  const molecules = filteredMolecules.value;
  const [busyFormatId, setBusyFormatId] = useState<DownloadFormatId | null>(
    null,
  );

  async function handleDownload(format: DownloadFormat): Promise<void> {
    setBusyFormatId(format.id);
    try {
      // A macrotask, so the spinner paints before the file of thousands of
      // molecules is built on this same thread.
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
      });
      downloadText(format.build(molecules), format.filename, format.mimeType);
    } finally {
      setBusyFormatId(null);
    }
  }

  return (
    <div className="download-bar">
      <HelpTooltip help={downloadScopeHelp(molecules.length)}>
        <span className={Classes.TEXT_MUTED}>Download {molecules.length}</span>
      </HelpTooltip>
      <ButtonGroup>
        {DOWNLOAD_FORMATS.map((format) => (
          <Button
            key={format.id}
            icon="download"
            text={format.label}
            disabled={molecules.length === 0 || busyFormatId !== null}
            loading={busyFormatId === format.id}
            tooltipProps={helpTooltip(
              molecules.length === 0 ? EMPTY_DOWNLOAD_HELP : format.help,
            )}
            onClick={() => {
              void handleDownload(format);
            }}
          />
        ))}
      </ButtonGroup>
    </div>
  );
}

type DownloadFormatId = 'sdf' | 'smiles' | 'csv';

interface DownloadFormat {
  id: DownloadFormatId;
  /** Text of the button. */
  label: string;
  /** Name the browser gives to the saved file. */
  filename: string;
  mimeType: string;
  /** What the tooltip of the button says. */
  help: HelpContent;
  build: (molecules: readonly GeneratedMolecule[]) => string;
}

const EMPTY_DOWNLOAD_HELP: HelpContent = {
  title: 'Nothing to download',
  description:
    'The selection is empty. Generate a library, or widen the brushes of the plot.',
};

const DOWNLOAD_FORMATS: readonly DownloadFormat[] = [
  {
    id: 'sdf',
    label: 'SDF',
    filename: 'library.sdf',
    mimeType: 'chemical/x-mdl-sdfile',
    help: {
      title: 'library.sdf',
      description:
        'One molfile per molecule, each followed by its predicted properties as named data fields. Opens in any chemistry package.',
      link: helpLink('download'),
    },
    build: toSDF,
  },
  {
    id: 'smiles',
    label: 'SMILES',
    filename: 'library.smi',
    mimeType: 'text/plain',
    help: {
      title: 'library.smi',
      description:
        'One canonical SMILES per line, structures only. The lightest format, and the one that loses the properties.',
      link: helpLink('download'),
    },
    build: toSmilesList,
  },
  {
    id: 'csv',
    label: 'CSV',
    filename: 'library.csv',
    mimeType: 'text/csv',
    help: {
      title: 'library.csv',
      description:
        'One row per molecule with its SMILES and every predicted property, named in the first row. For a spreadsheet or a script.',
      link: helpLink('download'),
    },
    build: toCSV,
  },
];

function downloadScopeHelp(count: number): HelpContent {
  return {
    title: `${formatInteger(count)} ${pluralize(count, 'molecule')}`,
    description:
      'A download holds exactly what the brushes of the plot keep, never the whole library. Clear them first to save everything.',
    link: helpLink('download'),
  };
}
