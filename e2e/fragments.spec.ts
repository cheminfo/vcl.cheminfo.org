/**
 * The fragment list of the builder: a row answers Enter like a button, and the
 * name inside it still takes every key, the space bar included.
 */

import { expect, test } from '@playwright/test';

/** First of the eight fragments the site ships with. */
const FIRST_FRAGMENT = 'acetyl';

test('a space typed into a fragment name is kept, and leaves the dialog shut', async ({
  page,
}) => {
  await page.goto('/');

  const name = page.locator('.fragment-row__name').first();
  await expect(name).toHaveText(FIRST_FRAGMENT);

  // The editable text starts editing when it takes focus, and puts the caret
  // at the end of the name.
  await name.locator('.bp6-editable-text').focus();
  const input = name.locator('input');
  await input.pressSequentially(' ester');
  await input.press('Enter');

  await expect(name).toHaveText(`${FIRST_FRAGMENT} ester`);
  await expect(page.locator('.fragment-dialog')).toHaveCount(0);
});

test('Enter on a fragment row opens that fragment in the dialog', async ({
  page,
}) => {
  await page.goto('/');

  await page.locator('.fragment-row').first().focus();
  await page.keyboard.press('Enter');

  await expect(page.locator('.fragment-dialog')).toContainText(
    `Edit ${FIRST_FRAGMENT}`,
  );
});
