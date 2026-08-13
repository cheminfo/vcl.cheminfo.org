import { expect, test } from 'vitest';

import { HELP_SECTIONS, helpLink } from '../../pages/help/data/helpSections.ts';
import { formatRoute, parseRoute } from '../view.ts';

test('a bare tab hash addresses that tab and no section', () => {
  expect(parseRoute('#/help')).toStrictEqual({ tab: 'help', section: null });
  expect(parseRoute('#/examples')).toStrictEqual({
    tab: 'examples',
    section: null,
  });
});

test('an empty or unknown hash falls back to the builder', () => {
  expect(parseRoute('')).toStrictEqual({ tab: 'builder', section: null });
  expect(parseRoute('#/')).toStrictEqual({ tab: 'builder', section: null });
  expect(parseRoute('#/nowhere')).toStrictEqual({
    tab: 'builder',
    section: null,
  });
});

test('the link of a tooltip addresses its help chapter', () => {
  expect(helpLink('draw-the-core')).toBe('#/help/draw-the-core');
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

test('a route is written back as the hash it was read from', () => {
  expect(formatRoute({ tab: 'help', section: 'download' })).toBe(
    '#/help/download',
  );
  expect(formatRoute({ tab: 'builder', section: null })).toBe('#/builder');
});

test('a trailing slash is not read as a section', () => {
  expect(parseRoute('#/help/')).toStrictEqual({ tab: 'help', section: null });
});
