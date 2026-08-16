import { SITE_URL, documentTitle } from './pageMeta.ts';
import { formatRoute, parseRoute } from './view.ts';

/**
 * Keep the tab and the canonical address in step with the page on screen. The
 * build already titles each file it wrote; this is what a move inside the app
 * changes, and what a crawler rendering the page reads afterwards.
 */
export function writeDocumentMeta(): void {
  if (typeof document === 'undefined') return;
  const { pathname } = globalThis.location;
  const { tab } = parseRoute(pathname);

  document.title = documentTitle(pathname);
  canonicalLink().href = `${SITE_URL}${formatRoute({ tab, section: null })}`;
}

function canonicalLink(): HTMLLinkElement {
  const existing = document.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (existing) return existing;

  const link = document.createElement('link');
  link.rel = 'canonical';
  document.head.append(link);
  return link;
}
