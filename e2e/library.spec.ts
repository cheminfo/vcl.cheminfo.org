/**
 * The work the site exists for: load a library, enumerate it, read the
 * properties of what came out, and screen it by brushing the plot.
 *
 * The counts asserted here are the ones the unit tests pin — `CLAIMED` in
 * `src/pages/help/__tests__/examples.test.ts` and the toluene row of
 * `src/vcl/__tests__/generate.test.ts` — so the page and the chemistry behind
 * it are held to the same numbers.
 */

import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/** How high a band is brushed off the top of an axis, in pixels. */
const BRUSH_HEIGHT = 12;

test('the benzene survey enumerates the fourteen molecules its card claims', async ({
  page,
}) => {
  await loadExample(page, 'Simple benzene survey');

  // One position on the ring, fourteen substituents, nothing to collapse.
  await expect(page.locator('.fragment-row')).toHaveCount(14);
  await expect(page.locator('.core-summary .bp6-tag')).toHaveText([
    'R1 · 14 fragments',
  ]);
  await expect(page.locator('.generate-status')).toContainText(
    '14 combinations to enumerate',
  );

  await generate(page);

  await expect(page.locator('.generate-outcome')).toContainText(
    '14 distinct molecules',
  );
  await expect(page.locator('.results-count')).toHaveText('14 molecules');
  await expect(page.locator('.molecule-row')).toHaveCount(14);
  await expect(page.locator('.download-bar')).toContainText('Download 14');

  // The first fragment is the methyl, so the first molecule is toluene, with
  // the properties the generator's own test pins for it.
  const toluene = page.locator('.molecule-row').first();
  await expect(toluene).toContainText('C7H8');
  await expect(toluene.locator('.molecule-cell-number')).toHaveText([
    '92.14',
    '2.00',
    '-1.96',
    '0.00',
    '0',
    '0',
    '0',
    '0',
  ]);
});

test('a library whose products repeat is enumerated once, not twice', async ({
  page,
}) => {
  await loadExample(page, 'Switchable-hydrophilicity solvents');

  await expect(page.locator('.generate-status')).toContainText(
    '216 combinations to enumerate',
  );

  await generate(page);

  // The two substituents of the amine nitrogen are interchangeable, so 216
  // combinations give 126 distinct structures.
  await expect(page.locator('.generate-outcome')).toContainText(
    '126 distinct molecules',
  );
  await expect(page.locator('.results-count')).toHaveText('126 molecules');
  await expect(page.locator('.download-bar')).toContainText('Download 126');
});

test('sorting the table on a property reorders it, heaviest first', async ({
  page,
}) => {
  await loadExample(page, 'Simple benzene survey');
  await generate(page);

  const molecularWeight = page
    .locator('.molecule-table-sort')
    .filter({ hasText: 'MW' });

  await molecularWeight.click();
  await expect(firstWeight(page)).toHaveText('92.14');

  await molecularWeight.click();
  // Bromobenzene is the heaviest of the fourteen.
  await expect(firstWeight(page)).toHaveText('157.01');
  await expect(page.locator('.molecule-row').first()).toContainText('C6H5Br');
});

test('brushing the top of the mass axis keeps the heaviest molecule alone', async ({
  page,
}) => {
  await loadExample(page, 'Simple benzene survey');
  await generate(page);

  await brushTopOfFirstAxis(page);

  const toolbar = page.locator('.results-toolbar');
  await expect(toolbar).toContainText('1 of 14 selected');
  await expect(page.locator('.molecule-row')).toHaveCount(1);
  await expect(page.locator('.molecule-row').first()).toContainText('C6H5Br');
  await expect(firstWeight(page)).toHaveText('157.01');
  // The downloads follow the selection rather than the whole library.
  await expect(page.locator('.download-bar')).toContainText('Download 1');

  await page.getByRole('button', { name: 'Clear filters' }).click();

  await expect(page.locator('.molecule-row')).toHaveCount(14);
  await expect(toolbar).not.toContainText('selected');
});

/**
 * Open the Examples tab and load one of its ready-made libraries, which lands
 * on the builder with that core and those fragments.
 * @param page - The page under test.
 * @param title - Heading of the example card.
 */
async function loadExample(page: Page, title: string): Promise<void> {
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
async function generate(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Generate library' }).click();
  await expect(page.locator('.generate-outcome')).toBeVisible({
    timeout: 60_000,
  });
}

/**
 * The mass of the molecule on the first row of the table.
 * @param page - The page under test.
 * @returns The first numeric cell of that row.
 */
function firstWeight(page: Page): Locator {
  return page
    .locator('.molecule-row')
    .first()
    .locator('.molecule-cell-number')
    .first();
}

/**
 * Drag a brush over the top band of the leftmost axis of the plot, which is
 * the molecular weight.
 *
 * The drag ends above the axis so d3 clamps the selection to its very top:
 * started a pixel below it, the heaviest molecule would fall outside the
 * interval the brush reports.
 * @param page - The page under test.
 */
async function brushTopOfFirstAxis(page: Page): Promise<void> {
  const overlay = page
    .locator('.parallel-coordinates-axis')
    .first()
    .locator('.overlay');
  await overlay.scrollIntoViewIfNeeded();
  const box = await overlay.boundingBox();
  if (box === null) throw new Error('the mass axis has no brush to drag');

  const x = box.x + box.width / 2;
  await page.mouse.move(x, box.y + BRUSH_HEIGHT);
  await page.mouse.down();
  await page.mouse.move(x, box.y - 40, { steps: 8 });
  await page.mouse.up();
}
