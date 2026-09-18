/**
 * The core editor of the builder: a stroke drawn on its canvas reaches the
 * core the library is enumerated from, and its toolbar explains itself.
 *
 * The editor is openchemlib's canvas, drawn inside an open shadow root that
 * locators do not pierce reliably, so its canvases are measured in the page.
 */

import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/** Side of one toolbar button, and the border around them, in CSS pixels. */
const TOOLBAR_BUTTON = 21;
const TOOLBAR_BORDER = 2;
/** Index of the Single bond tool, down the first column of the toolbar. */
const SINGLE_BOND_BUTTON = 5;

/** The four R groups of the default pyridine core, each offered 8 fragments. */
const DEFAULT_R_GROUPS = [
  'R1 · 8 fragments',
  'R2 · 8 fragments',
  'R3 · 8 fragments',
  'R4 · 8 fragments',
];

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

test('a bond drawn on the core editor reaches the core the library is built on', async ({
  page,
}) => {
  await page.goto('/');
  const summary = page.locator('.core-summary');
  await expect(summary).toContainText('10 atoms');

  // The default tool is the single bond: a click on empty canvas, below the
  // ring and away from the help button in the top right corner, adds one.
  const canvas = await editorBox(page, 'drawing');
  await page.mouse.click(
    canvas.x + canvas.width - 80,
    canvas.y + canvas.height - 40,
  );

  // Two new carbons, bonded to each other and not to the ring, so the core
  // grows while its R groups, and what they enumerate, stay as they were.
  await expect(summary).toContainText('12 atoms');
  await expect(summary.locator('.bp6-tag')).toHaveText(DEFAULT_R_GROUPS);
  await expect(page.locator('.generate-status')).toContainText(
    '4,096 combinations to enumerate',
  );
});

test('the core editor names its toolbar buttons and opens a guide to the keys', async ({
  page,
}) => {
  await page.goto('/');

  const toolbar = await editorBox(page, 'toolbar');
  await page.mouse.move(
    toolbar.x + TOOLBAR_BORDER + TOOLBAR_BUTTON / 2,
    toolbar.y +
      TOOLBAR_BORDER +
      SINGLE_BOND_BUTTON * TOOLBAR_BUTTON +
      TOOLBAR_BUTTON / 2,
  );
  await expect(page.getByTestId('structure-editor-tooltip')).toContainText(
    'Single bond',
  );

  await page.getByRole('button', { name: 'Mouse and keyboard' }).click();
  await expect(page.getByTestId('structure-editor-help')).toBeVisible();
});

/**
 * Where one canvas of the core editor is drawn, once the editor has laid it
 * out: the toolbar is the first child of its shadow root, the drawing area the
 * canvas that takes the keyboard focus.
 * @param page - The page under test.
 * @param part - Which of the two canvases.
 * @returns Its box in the viewport, in CSS pixels.
 */
async function editorBox(
  page: Page,
  part: 'toolbar' | 'drawing',
): Promise<Box> {
  const handle = await page.waitForFunction((which) => {
    const shadow = document.querySelector(
      '[data-openchemlib-canvas-editor]',
    )?.shadowRoot;
    const element =
      which === 'toolbar'
        ? shadow?.firstElementChild
        : shadow?.querySelector('canvas[tabindex]');
    if (!element) return null;
    const { x, y, width, height } = element.getBoundingClientRect();
    return width > 0 && height > 0 ? { x, y, width, height } : null;
  }, part);
  return (await handle.jsonValue()) as Box;
}
