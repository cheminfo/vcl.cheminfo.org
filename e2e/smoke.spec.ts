/**
 * The shell: the builder standing on the home address with the library it
 * ships with, the family's bar above it, the family's footer below, and a tab
 * bar that is the address itself.
 *
 * Each step of the builder is located by the class its card carries, so a
 * reworded control inside one never breaks this file.
 */

import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { groupedSites, siteUrl } from 'react-cheminfo/core';

/** Every page of the site: its address, its entry in the bar, and its title. */
const PAGES = [
  {
    path: '/',
    label: 'Builder',
    title: 'Virtual combinatorial library — enumerate and screen it',
  },
  {
    path: '/examples',
    label: 'Examples',
    title: 'Worked examples of a combinatorial library',
  },
  {
    path: '/help',
    label: 'Help',
    title: 'How to build a combinatorial library — the manual',
  },
  {
    path: '/about',
    label: 'About',
    title: 'About — what it is built on, and how to cite it',
  },
] as const;

/** What the tab writes after the page's own title, on every address. */
const TITLE_SUFFIX = ' — vcl.cheminfo.org';

/**
 * The eight fragments the builder starts with, in the order they are listed.
 * Together with the pyridine core they are the 4096 combinations the unit
 * tests pin.
 */
const DEFAULT_FRAGMENTS = [
  'acetyl',
  'hydroxymethyl',
  'N-methylaminomethyl',
  'ethoxymethyl',
  'phenyl',
  'ethyl',
  'propyl',
  'hydrogen (no substituent)',
];

test('the home address opens the builder, on the library it ships with', async ({
  page,
}) => {
  await page.goto('/');

  // The four numbered steps, in the order a library is built in.
  await expect(page.locator('main h5')).toHaveText([
    '1. Core structure',
    '2. Fragments',
    '3. Generate',
    '4. Library',
  ]);

  // Pyridine bearing R1 to R4: ten atoms, and every fragment allowed at each.
  await expect(page.locator('.core-summary .bp6-tag')).toHaveText([
    'R1 · 8 fragments',
    'R2 · 8 fragments',
    'R3 · 8 fragments',
    'R4 · 8 fragments',
  ]);
  await expect(page.locator('.core-summary')).toContainText('10 atoms');
  await expect(page.locator('.fragment-row__name')).toHaveText(
    DEFAULT_FRAGMENTS,
  );

  // Eight fragments on four positions, which is what the unit tests enumerate.
  await expect(page.locator('.generate-status')).toContainText(
    '4,096 combinations to enumerate',
  );
  // Nothing has been enumerated yet, so the library is empty and says so.
  await expect(page.locator('.results-count')).toHaveText('0 molecules');
  await expect(page.locator('.results-panel')).toContainText('No molecules');
  await expect(page.locator('.molecule-row')).toHaveCount(0);
});

test('the bar carries the site pages on the left and the utilities on the right', async ({
  page,
}) => {
  await page.goto('/');

  const brand = page.locator('.app-header a.brand');
  await expect(brand).toHaveText('vcl.cheminfo');
  await expect(brand).toHaveAttribute('href', '/');
  await expect(brand).toHaveAttribute('title', 'vcl.cheminfo.org');

  await expect(page.locator('.app-header a.nav-link')).toHaveText([
    'Builder',
    'Examples',
    'Help',
    'About',
  ]);
  // Cite and Tools, the two utilities every site of the family carries. Read by
  // role, which leaves out the menu the pages fold into on a phone only.
  await expect(page.locator('.app-header').getByRole('button')).toHaveText([
    'Cite',
    'Tools',
  ]);
  await expect(navLink(page, 'Builder')).toHaveClass(/nav-link--active/);
});

test('the footer walks to every sister site, and marks the one being read', async ({
  page,
}) => {
  await page.goto('/');

  const footer = page.locator('.app-footer');
  await expect(footer.locator('h2')).toHaveText('Our other tools');
  // Every site of the shared registry is a link, in the order the footer
  // gathers them under their topics, except this one, written as plain text
  // because a visitor is already on it.
  const sisterUrls: string[] = [];
  for (const { sites } of groupedSites()) {
    for (const site of sites) {
      if (site.id !== 'vcl') sisterUrls.push(siteUrl(site));
    }
  }
  const links = footer.locator('.ecosystem-links a');
  await expect(links).toHaveCount(sisterUrls.length);
  expect(
    await links.evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute('href')),
    ),
  ).toStrictEqual(sisterUrls);
  await expect(footer.getByText('you are here')).toHaveCount(1);
  await expect(
    footer.locator('.ecosystem-links a[href="https://smiles.cheminfo.org/"]'),
  ).toHaveCount(1);
  await expect(
    footer.locator('.ecosystem-links a[href="https://www.chemcalc.org/"]'),
  ).toHaveCount(1);
  await expect(
    footer.locator('.ecosystem-links a[href="https://vcl.cheminfo.org/"]'),
  ).toHaveCount(0);
});

for (const entry of PAGES) {
  test(`${entry.path} answers under its own title, canonical and tab`, async ({
    page,
  }) => {
    await page.goto(entry.path);

    await expect(page).toHaveTitle(entry.title + TITLE_SUFFIX);
    await expect(navLink(page, entry.label)).toHaveClass(/nav-link--active/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `http://localhost:10104${entry.path}`,
    );
  });
}

test('the bar moves the address, and the back button walks it back', async ({
  page,
}) => {
  await page.goto('/');

  await navLink(page, 'Examples').click();
  await expect(page.locator('.example-card')).toHaveCount(4);
  await expect.poll(() => pathOf(page.url())).toBe('/examples');

  await navLink(page, 'Help').click();
  await expect(page.locator('main')).toContainText('What this tool does');
  await expect.poll(() => pathOf(page.url())).toBe('/help');

  await page.goBack();

  await expect(page.locator('.example-card')).toHaveCount(4);
  await expect.poll(() => pathOf(page.url())).toBe('/examples');
});

test('an address the site does not know opens the builder', async ({
  page,
}) => {
  await page.goto('/not-a-tab');

  await expect(page.locator('.core-panel')).toContainText('1. Core structure');
  await expect(navLink(page, 'Builder')).toHaveClass(/nav-link--active/);
  // The canonical points at the page actually shown, so an address naming
  // nothing is never indexed as a second home page.
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'http://localhost:10104/',
  );
});

/**
 * One page entry of the site bar.
 *
 * Scoped to the header, because the footer links every sister site and one of
 * their names could otherwise match. Located on what the entry reads rather
 * than on its accessible name: About carries a `title`, which becomes its
 * `aria-label` and would hide the word it shows.
 * @param page - The page under test.
 * @param label - What the entry reads.
 * @returns The link.
 */
function navLink(page: Page, label: string): Locator {
  return page.locator('.app-header a.nav-link').filter({ hasText: label });
}

/**
 * The path of a URL, without its origin.
 * @param url - The address the page is on.
 * @returns Its pathname.
 */
function pathOf(url: string): string {
  return new URL(url).pathname;
}
