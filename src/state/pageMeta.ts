import type { Route, TabId } from './view.ts';
import { TAB_IDS, formatRoute, parseRoute } from './view.ts';

export const SITE_NAME = 'vcl.cheminfo.org';
export const SITE_URL = 'https://vcl.cheminfo.org';

export interface PageMeta {
  /** What the tab, the search result and the shared card are titled. */
  title: string;
  /** The line under the title in a search result and a shared card. */
  description: string;
  /** The address this page is indexed under. */
  canonicalPath: string;
}

const META: Record<TabId, { title: string; description: string }> = {
  builder: {
    title: 'Virtual combinatorial library — enumerate and screen it',
    description:
      'Draw a core carrying R groups, give each one a set of fragments, and enumerate every product — then screen the library on its predicted properties, in the browser.',
  },
  examples: {
    title: 'Worked examples of a combinatorial library',
    description:
      'Ready-made cores and fragment sets to open in one click: see how an R group is drawn, how a library grows, and what screening it on predicted properties leaves.',
  },
  help: {
    title: 'How to build a combinatorial library — the manual',
    description:
      'From drawing a core with its R groups to reading the property plot: every step of building and screening a virtual combinatorial library, with the glossary of every term it uses.',
  },
};

/**
 * The title, the description and the canonical address of a page. The build
 * writes one file per address from this, and the page keeps its tab in step
 * with it as the visitor moves.
 * @param route - The tab, and the section when the address names one.
 * @returns What that page is called and what it is about.
 */
export function pageMetaFor(route: Route): PageMeta {
  const { title, description } = META[route.tab];
  // A section is an anchor inside a page, not a page: it is indexed under the
  // page holding it.
  return {
    title,
    description,
    canonicalPath: formatRoute({ tab: route.tab, section: null }),
  };
}

/**
 * The address of each page, and what it is called. The sitemap lists these, and
 * the build writes one file per entry.
 * @returns Every page of the site, the builder first.
 */
export function everyPage(): PageMeta[] {
  return TAB_IDS.map((tab) => pageMetaFor({ tab, section: null }));
}

/**
 * What the tab says on the page currently open.
 * @param pathname - The path of the address.
 * @returns The title, site name included.
 */
export function documentTitle(pathname: string): string {
  return `${pageMetaFor(parseRoute(pathname)).title} — ${SITE_NAME}`;
}
