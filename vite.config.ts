import react from '@vitejs/plugin-react';
import { cheminfoPrerender } from 'react-cheminfo/vite';
import { defineConfig } from 'vite';

import { NOSCRIPT_ROUTES, PAGE_ROUTES } from './src/state/routes.ts';
import { configuredSiteUrl } from './src/state/sitePath.ts';

// Derived from the project creation date 2026-01-03: 6 + 01 + 03 = 60103,
// over 60000 so minus 50000 gives the 10103 published by docker compose. The
// dev server takes that port plus one.
const DEV_SERVER_PORT = 10104;

// The address this build names as its own, for the canonical link, the social
// card and the sitemap. It says nothing about where the build is *mounted* —
// see `base` below.
const siteUrl = configuredSiteUrl();

export default defineConfig({
  // The build carries no mount path. Every asset is written relative, so the
  // one `dist` serves the site's own host and a path of a shared one without
  // being rebuilt: the `<base>` the container stamps in at startup is what
  // resolves them, and the page reads its mount back off that.
  base: './',
  plugins: [
    react(),
    // A static image has no server to write the head per request, so the build
    // writes one real file per address instead, plus the sitemap and the robots
    // policy. `origin` carries the mount path as well as the host, which is
    // what makes every canonical, card, sitemap entry and `Allow:` line come
    // out under it.
    cheminfoPrerender({
      site: 'vcl',
      routes: PAGE_ROUTES,
      // The whole published address, mount path included: it is what the
      // canonical link, the social card and the sitemap are written from.
      origin: siteUrl,
      category: 'ScienceApplication',
      operatingSystem: 'Any',
      // What the tool does, in the words a search result is read in: it says
      // more than the line the family menu carries.
      description:
        'Build a virtual combinatorial library from a core structure with R groups and a set of fragments, then screen the enumerated products on their predicted properties.',
      noscript: {
        heading: 'vcl.cheminfo.org — virtual combinatorial libraries',
        intro:
          'Draw a core carrying R groups, give each one a set of fragments, and enumerate every product — then screen the library on its predicted properties. The chemistry runs in your browser, so the tool needs JavaScript.',
        // Relative, because the build bakes in no mount: these resolve against
        // the `<base>` the container stamps in at startup, so the one image
        // links its own pages under both addresses it is served at.
        hrefs: 'relative',
        // The three tabs, under the names the tab bar gives them rather than
        // the sentences they are indexed under.
        routes: NOSCRIPT_ROUTES,
        ecosystem: { taglines: false },
      },
    }),
  ],
  server: {
    port: DEV_SERVER_PORT,
    // Fail loudly instead of drifting to the next free port, which would leave
    // the README and any bookmarked URL disagreeing with reality.
    strictPort: true,
  },
});
