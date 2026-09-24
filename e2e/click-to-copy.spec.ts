/**
 * The family's rule about text: the tool is clicked and dragged, not read, so
 * nothing on it paints blue; what a chemist would paste elsewhere — a SMILES, a
 * formula, a predicted value — is taken with one click instead. The manual is
 * the exception: it is prose, and it stays selectable.
 *
 * The values asserted here are the ones the unit tests pin for toluene, the
 * first molecule of the benzene survey.
 */

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

import { generate, loadExample } from './builder.ts';

/** Canonical isomeric SMILES of toluene, as the enumeration writes it. */
const TOLUENE_SMILES = 'Cc1ccccc1';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test('the text of the builder cannot be selected', async ({ page }) => {
  await page.goto('/');

  const heading = page.locator('.core-panel .help-label');
  await expect(heading).toHaveText('1. Core structure');
  await expect(heading).toHaveCSS('user-select', 'none');

  await heading.dblclick();
  const selected = await page.evaluate(
    () => window.getSelection()?.toString() ?? '',
  );
  expect(selected).toBe('');
});

test('clicking the drawing of a molecule copies its SMILES, and nothing else', async ({
  page,
}) => {
  await loadExample(page, 'Simple benzene survey');
  await generate(page);

  const toluene = page.locator('.molecule-row').first();
  const structure = toluene.locator('.click-to-copy').first();
  await expect(structure).toHaveCSS('cursor', 'copy');
  await expect(structure).toHaveAttribute(
    'title',
    `Copy the SMILES (${TOLUENE_SMILES})`,
  );

  await structure.click();
  await expect(structure).toHaveAttribute('data-copy', 'copied');
  expect(await readClipboard(page)).toBe(TOLUENE_SMILES);

  // The copy stops at the value: the row it sits in is not selected by it.
  await expect(toluene).not.toHaveAttribute('data-selected', 'true');
});

test('the formula and the predicted values of a row are copied one by one', async ({
  page,
}) => {
  await loadExample(page, 'Simple benzene survey');
  await generate(page);

  const toluene = page.locator('.molecule-row').first();

  const formula = toluene.getByTitle('Copy the molecular formula (C7H8)');
  await formula.click();
  await expect(formula).toHaveAttribute('data-copy', 'copied');
  expect(await readClipboard(page)).toBe('C7H8');

  // The mass is copied bare, without the g/mol the column heading carries.
  const mass = toluene.locator('.molecule-cell-number').first();
  await expect(mass).toHaveAttribute(
    'title',
    'Copy the molecular weight (92.14)',
  );
  await mass.click();
  await expect(mass).toHaveAttribute('data-copy', 'copied');
  expect(await readClipboard(page)).toBe('92.14');

  await expect(toluene).not.toHaveAttribute('data-selected', 'true');

  // The row number is what still selects the molecule.
  await toluene.locator('.bp6-text-muted').click();
  await expect(toluene).toHaveAttribute('data-selected', 'true');
});

test('the manual stays selectable, and its table of contents does not', async ({
  page,
}) => {
  await page.goto('/help');

  const content = page.locator('.help-content');
  await expect(content).toHaveCSS('user-select', 'text');
  await expect(content.locator('p').first()).toHaveCSS('user-select', 'text');
  await expect(page.locator('.help-toc')).toHaveCSS('user-select', 'none');
});

/**
 * What the click just put on the clipboard.
 * @param page - The page under test.
 * @returns The clipboard text.
 */
function readClipboard(page: Page): Promise<string> {
  return page.evaluate(() => navigator.clipboard.readText());
}
