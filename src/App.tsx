import { Tooltip } from '@blueprintjs/core';
import { useSignalEffect } from '@preact/signals-react';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { CiteButton, EcosystemButton } from 'react-cheminfo/ui';

import { BrandMark, Wordmark } from './components/shared/Brand.tsx';
import type { HelpContent } from './components/shared/helpContent.tsx';
import { helpTooltip } from './components/shared/helpContent.tsx';
import { BuilderPage } from './pages/builder/BuilderPage.tsx';
import { ExamplesPage } from './pages/help/ExamplesPage.tsx';
import { HelpPage } from './pages/help/HelpPage.tsx';
import { PAPER } from './paper.ts';
import type { Route, TabId } from './state/view.ts';
import { formatRoute, parseRoute, setActiveTab, view } from './state/view.ts';

const TABS: ReadonlyArray<{ id: TabId; label: string; help: HelpContent }> = [
  {
    id: 'builder',
    label: 'Builder',
    help: {
      title: 'Builder',
      description:
        'Draw the core and the fragments, enumerate the library, then filter it on its predicted properties.',
    },
  },
  {
    id: 'examples',
    label: 'Examples',
    help: {
      title: 'Examples',
      description:
        'Four ready made libraries. Loading one replaces the core and the fragments of the builder.',
    },
  },
  {
    id: 'help',
    label: 'Help',
    help: {
      title: 'Help',
      description:
        'The manual, from drawing a core to reading the plot, and the glossary of every term it underlines.',
    },
  },
];

/**
 * Application shell: the sticky header with the tab bar and the external links,
 * plus the page the active tab selects. The active tab is mirrored in the
 * location hash, so every tab is a shareable URL and the back button works.
 * @returns The whole application.
 */
export function App(): ReactElement {
  useSignals();
  const activeTab = view.activeTab.value;

  useEffect(() => {
    function synchronizeFromHash(): void {
      setActiveTab(routeFromHash().tab);
    }
    // replaceState rather than an assignment: the first load must not push an
    // extra history entry the back button would then have to walk through.
    const canonicalHash = formatRoute(routeFromHash());
    if (window.location.hash !== canonicalHash) {
      window.history.replaceState(null, '', canonicalHash);
    }
    synchronizeFromHash();
    window.addEventListener('hashchange', synchronizeFromHash);
    return () => {
      window.removeEventListener('hashchange', synchronizeFromHash);
    };
  }, []);

  useSignalEffect(() => {
    const tab = view.activeTab.value;
    // Only the tab is compared: a hash addressing a section of the tab being
    // shown, e.g. #/help/draw-the-core, must survive.
    if (routeFromHash().tab !== tab) window.location.hash = `#/${tab}`;
  });

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <a href="#/builder" className="brand" title="vcl.cheminfo.org">
            <BrandMark />
            <Wordmark />
          </a>
          <nav className="app-header-nav">
            {TABS.map((tab) => (
              <Tooltip key={tab.id} {...helpTooltip(tab.help)}>
                <button
                  type="button"
                  className={
                    tab.id === activeTab
                      ? 'nav-link nav-link--active'
                      : 'nav-link'
                  }
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                >
                  {tab.label}
                </button>
              </Tooltip>
            ))}
          </nav>
          <div className="app-header-actions">
            <CiteButton reference={PAPER} />
            <EcosystemButton currentSiteId="vcl" />
          </div>
        </div>
      </header>
      <p className="app-tagline">
        Combine a core carrying R groups with a set of fragments, then screen
        the enumerated library on its predicted properties.
      </p>
      <main className="app-body">{renderPage(activeTab)}</main>
    </div>
  );
}

function renderPage(tab: TabId): ReactElement {
  if (tab === 'examples') return <ExamplesPage />;
  if (tab === 'help') return <HelpPage />;
  return <BuilderPage />;
}

function routeFromHash(): Route {
  return parseRoute(window.location.hash);
}
