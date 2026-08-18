/**
 * The address this site is published at, and the one it names as its own.
 *
 * It is what the canonical link, the social card and the sitemap are written
 * from, so it survives being mirrored: a deployment serving the same build
 * under a second address still points a crawler back here, and the two never
 * compete for one search result.
 *
 * Where a deployment is *mounted* is a different question, and not this one:
 * the build is mount-agnostic and the mount is read off the page at run time.
 * See `site.ts`.
 */
export const DEFAULT_SITE_URL = 'https://vcl.cheminfo.org/';

/** What the tab, the social card and the sitemap call this site. */
export const SITE_NAME = 'vcl.cheminfo.org';

/**
 * The address this build names as its own.
 *
 * Read through `globalThis` so the one module type-checks in a page, in a vite
 * config and in a build script alike.
 * @returns What `SITE_URL` says, or the default when it says nothing.
 */
export function configuredSiteUrl(): string {
  const environment = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env?.SITE_URL;
  return environment || DEFAULT_SITE_URL;
}
