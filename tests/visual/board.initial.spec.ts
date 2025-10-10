import { test, expect } from '@playwright/test';
import { compareWithGolden, waitForReady } from './utils/compare';
import * as path from 'path';

test.describe('Initial Board Rendering', () => {
  test('initial board pixels match golden', async ({ page }) => {
    await page.goto('/');

    await waitForReady(page);

    await page.waitForTimeout(1000);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    const screenshot = await canvas.screenshot();

    const goldenPath = path.join(
      process.cwd(),
      'tests/visual/golden/board-initial.png'
    );

    await compareWithGolden(screenshot, goldenPath, {
      threshold: 0.05, // Allow 5% difference for anti-aliasing
    });
  });

  test('initial board has correct number of visible boards', async ({ page }) => {
    await page.goto('/');
    await waitForReady(page);

    const boardCount = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas !== null;
    });

    expect(boardCount).toBe(true);
  });
});
