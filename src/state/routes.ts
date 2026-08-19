/**
 * Every address the site answers, with the name and the sentence it is indexed
 * under.
 *
 * One table, read by three things: the build, which writes an HTML file per
 * entry and the sitemap listing them; the head injector; and the running app,
 * which retitles the tab after an in-app move. A page missing from here is a
 * page a search engine only ever sees as the home page.
 *
 * The machinery that reads it is `react-cheminfo/core` and
 * `react-cheminfo/vite`; what belongs to this site is the prose below. Nothing
 * else may be imported here: the vite config reads this file, so a runtime
 * import would drag the application into the build's own process.
 */

import type { NoscriptRoute, RouteMeta } from 'react-cheminfo/core';

/** The three tabs of the site, then the About every site of the family carries. */
export const PAGE_ROUTES: readonly RouteMeta[] = [
  {
    path: '/',
    title: 'Virtual combinatorial library — enumerate and screen it',
    description:
      'Draw a core, give each R group a set of fragments, enumerate the library, then screen it on MW, logP, PSA, rotatable bonds and four more predicted properties.',
  },
  {
    path: '/examples',
    title: 'Worked examples of a combinatorial library',
    description:
      'Ready-made cores and fragment sets to open in one click: see how an R group is drawn, how a library grows, and what screening it on predicted properties leaves.',
  },
  {
    path: '/help',
    title: 'How to build a combinatorial library — the manual',
    description:
      'From drawing a core with its R groups to brushing the property plot: every step of building and screening a virtual combinatorial library, plus its glossary.',
  },
  {
    path: '/about',
    title: 'About — what it is built on, and how to cite it',
    description:
      'What this virtual combinatorial library builder is, the paper its approach comes from, the open work it runs on, and where to report a problem.',
  },
];

/** What each page is linked as in the crawl path: its menu name, and what it is for. */
const NOSCRIPT_LABELS: Record<string, Pick<NoscriptRoute, 'short' | 'note'>> = {
  '/': { short: 'Builder', note: 'draw a core and enumerate the library' },
  '/examples': { short: 'Examples', note: 'ready-made libraries' },
  '/help': { short: 'Help', note: 'the manual and the glossary' },
  '/about': { short: 'About', note: 'credits, citation and licence' },
};

/**
 * The pages the crawl path a visitor with no JavaScript reads links.
 *
 * A crawl path is a menu, so each page is linked under the name the site's own
 * tab bar gives it rather than the sentence it is indexed under, with what the
 * page is for written next to it.
 */
export const NOSCRIPT_ROUTES: readonly NoscriptRoute[] = PAGE_ROUTES.map(
  (route) => ({ ...route, ...NOSCRIPT_LABELS[route.path] }),
);
