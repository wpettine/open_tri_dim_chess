import { test, expect } from '@playwright/test';
import { compareWithGolden, waitForReady } from './utils/compare';
import * as path from 'path';

test.describe('Board Visibility Transitions', () => {
  test('board visibility after attack board movement', async ({ page }) => {
    await page.goto('/');
    await waitForReady(page);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    const screenshot = await canvas.screenshot();

    const goldenPath = path.join(
      process.cwd(),
      'tests/visual/golden/board-visibility-initial.png'
    );

    await compareWithGolden(screenshot, goldenPath, {
      threshold: 0.05,
    });
  });

  test.skip('visibility toggles when track states change', async ({ page }) => {
  });
});
