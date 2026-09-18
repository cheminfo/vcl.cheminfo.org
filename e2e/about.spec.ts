/**
 * The About page: what the site is, what it can do, what it borrows, how to
 * cite it, and which release is running.
 *
 * Every string asserted here is a string of `src/about.ts`, so the page and the
 * record it is drawn from cannot drift apart — and a section the shared
 * `AboutPage` stops rendering is caught rather than silently lost.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';
import { UNRELEASED_VERSION } from 'react-cheminfo/core';

/** The version release-please writes into the root `package.json`. */
const VERSION = (
  JSON.parse(
    readFileSync(join(import.meta.dirname, '../package.json'), 'utf8'),
  ) as { version: string }
).version;

/**
 * What the hero badge reads: the release when there is one, the commit the
 * build was made from before the first one, and the instant it was made.
 */
const BUILD_BADGE = new RegExp(
  String.raw`^${
    VERSION === UNRELEASED_VERSION
      ? String.raw`[\da-f]{7}`
      : VERSION.replaceAll('.', String.raw`\.`)
  } · \d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC$`,
);

/** The six things `ABOUT.can` says a visitor can do here. */
const CAN = [
  'Draw a core with up to four R groups, and the fragments each one accepts.',
  'Enumerate every combination in a Web Worker, duplicate structures dropped.',
  'Read eight predicted properties per molecule, the Lipinski four included.',
  'Brush any axis of the parallel coordinates plot to filter the library.',
  'Download the filtered set as SDF, SMILES or CSV.',
  'Open one of four ready-made libraries to see the whole flow at once.',
];

/** Every borrowed work `ABOUT.credits` names, in the order it names them. */
const CREDIT_NAMES = [
  'OpenChemLib',
  'openchemlib-utils',
  'react-ocl',
  'react-mf',
  'Blueprint',
  'react-science',
  'react-cheminfo',
  'React',
  'Vite',
];

/** The licence each of those works comes under, in the same order. */
const CREDIT_LICENCES = [
  'BSD-3-Clause',
  'MIT',
  'MIT',
  'MIT',
  'Apache-2.0',
  'MIT',
  'MIT',
  'MIT',
  'MIT',
];

test('the About answers on its own address, naming the site and what it is for', async ({
  page,
}) => {
  await page.goto('/about');

  await expect(page).toHaveTitle(
    'About — what it is built on, and how to cite it — vcl.cheminfo.org',
  );
  const hero = page.locator('.about-hero');
  await expect(hero.locator('h1')).toHaveText('vcl.cheminfo');
  await expect(hero).toContainText(
    'Combine a core and fragments into a screened library.',
  );
  await expect(hero).toContainText(
    'Draw a core carrying R groups and the fragments that may fill them, enumerate every product, and screen the library on predicted properties.',
  );
});

test('the sections are the three the family writes for a private repository, in the family order', async ({
  page,
}) => {
  await page.goto('/about');

  await expect(page.locator('.about-page h2')).toHaveText([
    'What you can do here',
    'Built on',
    'How to cite',
  ]);
});

test('what you can do here is the six things the record lists', async ({
  page,
}) => {
  await page.goto('/about');

  await expect(page.locator('.about-can li')).toHaveText(CAN);
});

test('every borrowed work is credited, under its own licence', async ({
  page,
}) => {
  await page.goto('/about');

  await expect(page.locator('.about-credits li a')).toHaveText(CREDIT_NAMES);
  // Naming the licence beside the work is what makes the list a credit rather
  // than a list of links, and it is the part a site forgets when it writes its
  // own page.
  await expect(
    page.locator('.about-credits li > span:nth-of-type(1)'),
  ).toHaveText(CREDIT_LICENCES);
});

test('the paper the method comes from is cited, with its DOI', async ({
  page,
}) => {
  await page.goto('/about');

  const cite = page.locator('.about-cite');
  await expect(cite).toContainText('The virtual screening approach');

  // The page names the work; its reference is what its Cite button opens.
  await cite
    .getByRole('button', {
      name: 'Cite The virtual screening approach',
      exact: true,
    })
    .click();
  const doi = page.locator('.citation-menu a[href^="https://doi.org/"]');
  await expect(doi).toHaveAttribute(
    'href',
    'https://doi.org/10.1039/C5GC01022E',
  );
  await expect(doi).toContainText('Green Chem. 2015');
  await expect(doi).toContainText('10.1039/C5GC01022E');
});

test('the private repository is named nowhere at all', async ({ page }) => {
  await page.goto('/about');

  // No licence, sources or build line: a reader cannot open the repository.
  await expect(page.locator('.about-licence')).toHaveCount(0);
  const about = page.locator('.about-page');
  await expect(about).not.toContainText('MIT, © cheminfo.');
  await expect(about).not.toContainText('from commit');
  await expect(
    about.getByRole('link', {
      name: 'github.com/cheminfo/vcl.cheminfo.org',
      exact: true,
    }),
  ).toHaveCount(0);
  // Nor a tracker: the issues of a private repository answer 404.
  await expect(page.locator('.about-issues')).toHaveCount(0);
  await expect(about).not.toContainText('Found a problem?');
});

test('the hero names the build it is serving, and dates it', async ({
  page,
}) => {
  await page.goto('/about');

  await expect(page.locator('.about-hero .about-version')).toHaveText(
    BUILD_BADGE,
  );
  // Never a link: the release page of a private repository answers 404.
  await expect(page.locator('a.about-version')).toHaveCount(0);
});
