import { afterEach, expect, test, vi } from 'vitest';

import { configuredSiteUrl } from '../sitePath.ts';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

/**
 * The site as a deployment stamped it, loaded fresh so its mount is read again.
 * @param baseUri - What `document.baseURI` reads on the page handed out.
 * @returns The module, bound to that mount.
 */
async function siteMountedAt(baseUri: string) {
  vi.stubGlobal('document', { baseURI: baseUri });
  vi.resetModules();
  return import('../site.ts');
}

test('a deployment on a host of its own writes its addresses unchanged', async () => {
  const site = await siteMountedAt('https://vcl.cheminfo.org/');

  expect(site.BASE_PATH).toBe('');
  expect(site.withBase('/')).toBe('/');
  expect(site.withBase('/exercises')).toBe('/exercises');
  expect(site.pathWithoutBase('/exercises')).toBe('/exercises');
});

test('a deployment mounted under a path writes every address under it', async () => {
  const site = await siteMountedAt('https://www.cheminfo.org/vcl/');

  expect(site.BASE_PATH).toBe('/vcl');
  expect(site.withBase('/')).toBe('/vcl/');
  expect(site.withBase('/exercises')).toBe('/vcl/exercises');
  expect(site.pathWithoutBase('/vcl/exercises')).toBe('/exercises');
  expect(site.pathWithoutBase('/vcl')).toBe('/');
});

test('the same build serves both addresses, because the mount is not built in', async () => {
  const own = await siteMountedAt('https://vcl.cheminfo.org/');
  const shared = await siteMountedAt('https://www.cheminfo.org/vcl/');

  expect(own.withBase('/about')).toBe('/about');
  expect(shared.withBase('/about')).toBe('/vcl/about');
});

test('a page of another tool on the shared host is not read as one of ours', async () => {
  const site = await siteMountedAt('https://www.cheminfo.org/vcl/');

  expect(site.pathWithoutBase('/surge/exercises')).toBe('/surge/exercises');
  expect(site.pathWithoutBase('/vclon')).toBe('/vclon');
});

test('the published address is the default until the build is told another', () => {
  expect(configuredSiteUrl()).toBe('https://vcl.cheminfo.org/');

  vi.stubGlobal('process', {
    env: { SITE_URL: 'https://example.org/vcl/' },
  });

  expect(configuredSiteUrl()).toBe('https://example.org/vcl/');
});
