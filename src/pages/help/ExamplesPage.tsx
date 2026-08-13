import { Callout, Card, H5, Tag } from '@blueprintjs/core';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { MolfileSvgRenderer } from 'react-ocl';
import { Button } from 'react-science/ui';

import { HelpTooltip } from '../../components/shared/HelpTooltip.tsx';
import type { HelpContent } from '../../components/shared/helpContent.tsx';
import { helpTooltip } from '../../components/shared/helpContent.tsx';
import { loadLibrary } from '../../state/preferences.ts';
import { setActiveTab } from '../../state/view.ts';

import type { LibraryExample } from './data/examples.ts';
import { LIBRARY_EXAMPLES, buildExampleLibrary } from './data/examples.ts';
import { helpLink } from './data/helpSections.ts';

const PREVIEW_WIDTH = 260;
const PREVIEW_HEIGHT = 150;

/**
 * The gallery of ready made libraries. Each card previews the core and loads
 * the whole library into the builder in one click.
 * @returns The Examples tab.
 */
export function ExamplesPage(): ReactElement {
  return (
    <div className="examples-page">
      <Callout
        intent="warning"
        icon="warning-sign"
        title="Loading an example replaces your library"
      >
        The core and the fragments currently in the Builder tab are overwritten.
        Download anything you still need before loading.
      </Callout>
      <div className="examples-grid">
        {LIBRARY_EXAMPLES.map((example) => (
          <ExampleCard key={example.id} example={example} />
        ))}
      </div>
    </div>
  );
}

interface ExampleCardProps {
  example: LibraryExample;
}

function loadHelp(title: string): HelpContent {
  return {
    title: `Load ${title}`,
    description:
      'Puts this core and these fragments in the builder and shows it. Whatever you had there is replaced.',
    link: helpLink('what-this-tool-does'),
  };
}

function fragmentCountHelp(count: number): HelpContent {
  return {
    title: `${count} fragments`,
    description:
      'How many substituents this example varies. Each one is ticked for the positions of the core it may occupy.',
    link: helpLink('draw-the-fragments'),
  };
}

function ExampleCard(props: ExampleCardProps): ReactElement {
  const { example } = props;
  const library = useMemo(() => buildExampleLibrary(example), [example]);

  return (
    <Card className="example-card">
      <H5>{example.title}</H5>
      <div className="example-preview">
        <MolfileSvgRenderer
          molfile={library.coreMolfile}
          width={PREVIEW_WIDTH}
          height={PREVIEW_HEIGHT}
          autoCrop
          autoCropMargin={6}
        />
      </div>
      <HelpTooltip help={fragmentCountHelp(library.fragments.length)}>
        <Tag minimal intent="primary">
          {`${library.fragments.length} fragments`}
        </Tag>
      </HelpTooltip>
      <p>{example.description}</p>
      <Button
        intent="primary"
        icon="import"
        text="Load this library"
        tooltipProps={helpTooltip(loadHelp(example.title))}
        onClick={() => {
          loadLibrary(library.coreMolfile, library.fragments);
          setActiveTab('builder');
        }}
      />
    </Card>
  );
}
