/**
 * What every site of the family promises: the tool works at `/`, the About is
 * a page of its own, `?embed` keeps the tool and drops the chrome, every routed
 * address loads cleanly, and an address the site does not know still opens it.
 *
 * The addresses come from `PAGE_ROUTES`, the table the build prerenders, so a
 * page added there is checked here without editing this file.
 */

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import { PAGE_ROUTES } from '../src/state/routes.ts';

/** What the tab writes after the page's own title, on every address. */
const TITLE_SUFFIX = ' — vcl.cheminfo.org';

test('the builder at / enumerates its default library into 3,872 distinct molecules', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.generate-status')).toContainText(
    '4,096 combinations to enumerate',
  );

  await page.getByRole('button', { name: 'Generate library' }).click();

  // The count `src/vcl/__tests__/generate.test.ts` pins for the default library.
  await expect(page.locator('.generate-outcome')).toContainText(
    '3,872 distinct molecules',
    { timeout: 60_000 },
  );
  await expect(page.locator('.results-count')).toHaveText('3872 molecules');
});

test('/about is the About page, under the header with Cite and above the footer', async ({
  page,
}) => {
  await page.goto('/about');

  await expect(
    page.getByRole('main').getByRole('heading', { level: 1 }),
  ).toHaveText('vcl.cheminfo');
  await expect(
    page
      .getByRole('banner')
      .locator('button')
      .filter({ hasText: /^Cite$/ }),
  ).toBeVisible();
  const footer = page.getByRole('contentinfo');
  await expect(footer).toBeVisible();
  await expect(footer.locator('h2')).toHaveText('Our other tools');
});

for (const query of ['?embed', '?embed=1']) {
  test(`/${query} drops the header and the footer, and the builder still works`, async ({
    page,
  }) => {
    await page.goto(`/${query}`);

    // Wait for the tool before asserting what is absent, so an unmounted page
    // cannot pass.
    await expect(page.locator('.generate-status')).toContainText(
      '4,096 combinations to enumerate',
    );
    await expect(page.getByRole('banner')).toHaveCount(0);
    await expect(page.getByRole('contentinfo')).toHaveCount(0);
    await expect(page.locator('.app-tagline')).toHaveCount(0);

    // Exact, because each fragment row is itself a button whose name ends with
    // the one of its trash button.
    await page
      .getByRole('button', { name: 'Remove fragment', exact: true })
      .first()
      .click();

    // Seven fragments left on each of the four R groups.
    await expect(page.locator('.fragment-row')).toHaveCount(7);
    await expect(page.locator('.generate-status')).toContainText(
      '2,401 combinations to enumerate',
    );
  });
}

for (const route of PAGE_ROUTES) {
  test(`${route.path} loads with no page error and no console error`, async ({
    page,
  }) => {
    const errors = collectErrors(page);

    await page.goto(route.path);

    await expect(page).toHaveTitle(route.title + TITLE_SUFFIX);
    await expect(page.getByRole('main')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(errors).toStrictEqual([]);
  });
}

test('a nested address the site does not know opens the builder, cleanly', async ({
  page,
}) => {
  const errors = collectErrors(page);

  await page.goto('/no/such/page');

  await expect(page.locator('.core-panel')).toContainText('1. Core structure');
  await expect(page.locator('.generate-status')).toContainText(
    '4,096 combinations to enumerate',
  );
  await page.waitForLoadState('networkidle');
  expect(errors).toStrictEqual([]);
});

/**
 * Record every uncaught exception and every `console.error` of a page.
 * @param page - The page under test.
 * @returns The list the messages are appended to, as they happen.
 */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => {
    errors.push(`pageerror: ${error.message}`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
}
