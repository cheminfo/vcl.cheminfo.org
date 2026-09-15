import { Tooltip } from '@blueprintjs/core';
import { useSignalEffect } from '@preact/signals-react';
import { useSignals } from '@preact/signals-react/runtime';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { startDocumentMeta } from 'react-cheminfo/core';
import {
  AboutPage,
  CiteButton,
  EcosystemButton,
  NavLink,
  SiteFooter,
  SiteHeader,
  SiteMark,
  SiteTheme,
} from 'react-cheminfo/ui';

import { ABOUT } from './about.ts';
import type { HelpContent } from './components/shared/helpContent.tsx';
import { helpTooltip } from './components/shared/helpContent.tsx';
import { BuilderPage } from './pages/builder/BuilderPage.tsx';
import { ExamplesPage } from './pages/help/ExamplesPage.tsx';
import { HelpPage } from './pages/help/HelpPage.tsx';
import { PAGE_ROUTES } from './state/routes.ts';
import { isEmbedded } from './state/share.ts';
import { absoluteUrl, pathWithoutBase, withBase } from './state/site.ts';
import type { Route, TabId } from './state/view.ts';
import { router, setActiveTab, view } from './state/view.ts';

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
 * plus the page the active tab selects. The active tab is the address, so every
 * tab is a shareable URL a crawler can fetch and the back button works.
 * @returns The whole application.
 */
export function App(): ReactElement {
  useSignals();
  const activeTab = view.activeTab.value;
  const embedded = isEmbedded();

  useEffect(() => {
    function synchronizeFromAddress(): void {
      setActiveTab(routeFromAddress().tab);
    }
    synchronizeFromAddress();
    window.addEventListener('popstate', synchronizeFromAddress);
    return () => {
      window.removeEventListener('popstate', synchronizeFromAddress);
    };
  }, []);

  useSignalEffect(() => {
    const tab = view.activeTab.value;
    // Only the tab is compared: an address naming a section of the tab being
    // shown, e.g. /help/draw-the-core, must survive.
    if (routeFromAddress().tab === tab) return;
    // The query carries `?embed`, which a move inside the tool must keep.
    window.history.pushState(
      null,
      '',
      withBase(router.format({ tab })) + window.location.search,
    );
  });

  // A section is an anchor inside a page, not a page: /help/draw-the-core is
  // indexed under /help. The canonical is written from the page rather than
  // from the build, so a deployment mounted under a path describes itself.
  useEffect(() => {
    startDocumentMeta({
      site: 'vcl',
      routes: PAGE_ROUTES,
      url: () => router.format({ tab: activeTab }),
      origin: absoluteUrl('/'),
    });
  }, [activeTab]);

  const nav = TABS.map((tab) => ({
    id: tab.id,
    label: tab.label,
    href: router.format({ tab: tab.id }),
    onSelect: () => setActiveTab(tab.id),
  }));

  return (
    <div className="app">
      <SiteTheme siteId="vcl" />
      <div className="app-screen">
        <SiteHeader
          siteId="vcl"
          width="full"
          embedded={embedded}
          nav={nav}
          activeId={activeTab}
          homeHref={withBase('/')}
          markSize={26}
          renderNavItem={(item, isActive) => {
            const tab = TABS.find((candidate) => candidate.id === item.id);
            if (tab === undefined) {
              return <NavLink item={item} active={isActive} />;
            }
            return (
              <Tooltip key={item.id} {...helpTooltip(tab.help)}>
                <NavLink item={item} active={isActive} />
              </Tooltip>
            );
          }}
          actions={
            <>
              {/* About leads the utilities on every site of the family, and is a
                real address rather than a dialog: a page is indexed, linkable
                and printable. */}
              <NavLink
                item={{
                  id: 'about',
                  label: 'About',
                  icon: <SiteMark siteId="vcl" size={14} />,
                  href: withBase('/about'),
                  title: 'What vcl.cheminfo.org is, and how to cite it',
                  onSelect: () => setActiveTab('about'),
                }}
                active={activeTab === 'about'}
              />
              {ABOUT.cite ? <CiteButton works={ABOUT.cite} /> : null}
              <EcosystemButton currentSiteId="vcl" />
            </>
          }
        />
        {/* The About draws the tagline in its own hero, so the shell does not
          write it twice. */}
        {activeTab === 'about' || embedded ? null : (
          <p className="app-tagline">
            Combine a core carrying R groups with a set of fragments, then
            screen the enumerated library on its predicted properties.
          </p>
        )}
        <main className="app-body">{renderPage(activeTab)}</main>
      </div>
      <SiteFooter siteId="vcl" width="full" embedded={embedded} />
    </div>
  );
}

function renderPage(tab: TabId): ReactElement {
  if (tab === 'examples') return <ExamplesPage />;
  if (tab === 'help') return <HelpPage />;
  if (tab === 'about') return <AboutPage content={ABOUT} />;
  return <BuilderPage />;
}

function routeFromAddress(): Route {
  return router.parse(pathWithoutBase(window.location.pathname));
}
