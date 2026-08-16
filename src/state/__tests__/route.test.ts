import { expect, test } from 'vitest';

import { HELP_SECTIONS, helpLink } from '../../pages/help/data/helpSections.ts';
import { everyPage, pageMetaFor } from '../pageMeta.ts';
import {
  TAB_IDS,
  formatRoute,
  parseRoute,
  pathFromLegacyHash,
} from '../view.ts';

test('a bare tab address addresses that tab and no section', () => {
  expect(parseRoute('/help')).toStrictEqual({ tab: 'help', section: null });
  expect(parseRoute('/examples')).toStrictEqual({
    tab: 'examples',
    section: null,
  });
});

test('an empty or unknown address falls back to the builder', () => {
  expect(parseRoute('')).toStrictEqual({ tab: 'builder', section: null });
  expect(parseRoute('/')).toStrictEqual({ tab: 'builder', section: null });
  expect(parseRoute('/nowhere')).toStrictEqual({
    tab: 'builder',
    section: null,
  });
});

test('the link of a tooltip addresses its help chapter', () => {
  expect(helpLink('draw-the-core')).toBe('/help/draw-the-core');
  expect(parseRoute(helpLink('draw-the-core'))).toStrictEqual({
    tab: 'help',
    section: 'draw-the-core',
  });
});

test('every help chapter is reachable through its link', () => {
  for (const section of HELP_SECTIONS) {
    const route = parseRoute(helpLink(section.id));

    expect(route.tab).toBe('help');
    expect(route.section).toBe(section.id);
  }
});

test('a route is written back as the address it was read from', () => {
  expect(formatRoute({ tab: 'help', section: 'download' })).toBe(
    '/help/download',
  );
  expect(formatRoute({ tab: 'examples', section: null })).toBe('/examples');
});

test('the builder is the home page rather than a second address for it', () => {
  expect(formatRoute({ tab: 'builder', section: null })).toBe('/');
  expect(parseRoute('/')).toStrictEqual({ tab: 'builder', section: null });
});

test('a trailing slash is not read as a section', () => {
  expect(parseRoute('/help/')).toStrictEqual({ tab: 'help', section: null });
});

test('a link written when the site routed by the hash still opens', () => {
  expect(pathFromLegacyHash('#/help')).toBe('/help');
  expect(pathFromLegacyHash('#/help/draw-the-core')).toBe(
    '/help/draw-the-core',
  );
  expect(pathFromLegacyHash('#/builder')).toBe('/');
  expect(pathFromLegacyHash('#/nowhere')).toBeNull();
  expect(pathFromLegacyHash('')).toBeNull();
});

test('every page is titled and described on its own', () => {
  const pages = everyPage();

  expect(pages).toHaveLength(TAB_IDS.length);
  expect(new Set(pages.map((page) => page.title)).size).toBe(pages.length);
  expect(new Set(pages.map((page) => page.description)).size).toBe(
    pages.length,
  );
  expect(pages.map((page) => page.canonicalPath)).toStrictEqual([
    '/',
    '/examples',
    '/help',
  ]);
});

test('a chapter of the manual is indexed under the manual', () => {
  expect(
    pageMetaFor({ tab: 'help', section: 'draw-the-core' }).canonicalPath,
  ).toBe('/help');
});
