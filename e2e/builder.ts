/**
 * What every spec that needs a library on screen does first: load one of the
 * ready-made examples, then enumerate it.
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Open the Examples tab and load one of its ready-made libraries, which lands
 * on the builder with that core and those fragments.
 * @param page - The page under test.
 * @param title - Heading of the example card.
 */
export async function loadExample(page: Page, title: string): Promise<void> {
  await page.goto('/examples');
  await page
    .locator('.example-card')
    .filter({ hasText: title })
    .getByRole('button', { name: 'Load this library' })
    .click();
  await expect(page.locator('.generate-panel')).toBeVisible();
}

/**
 * Enumerate the library currently in the builder, and wait for the run to
 * report what it produced.
 * @param page - The page under test.
 */
export async function generate(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Generate library' }).click();
  await expect(page.locator('.generate-outcome')).toBeVisible({
    timeout: 60_000,
  });
}
