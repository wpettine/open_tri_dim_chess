import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import * as fs from 'fs';
import * as path from 'path';

export interface CompareOptions {
  threshold?: number;
  diffDir?: string;
  updateSnapshots?: boolean;
}

/**
 * Compares an actual screenshot buffer with a golden baseline image.
 * Throws an error if the images differ beyond the threshold.
 * 
 * @param actualBuffer - The screenshot buffer to compare
 * @param goldenPath - Path to the golden baseline image
 * @param options - Comparison options
 */
export async function compareWithGolden(
  actualBuffer: Buffer,
  goldenPath: string,
  options: CompareOptions = {}
): Promise<void> {
  const {
    threshold = 0.03,
    diffDir = 'tests/visual/diffs',
    updateSnapshots = process.env.PLAYWRIGHT_UPDATE_SNAPSHOTS === '1',
  } = options;

  const actualPng = PNG.sync.read(actualBuffer);

  if (!fs.existsSync(goldenPath)) {
    if (updateSnapshots) {
      const goldenDir = path.dirname(goldenPath);
      if (!fs.existsSync(goldenDir)) {
        fs.mkdirSync(goldenDir, { recursive: true });
      }
      
      fs.writeFileSync(goldenPath, actualBuffer);
      console.log(`Created new golden image: ${goldenPath}`);
      return;
    } else {
      throw new Error(
        `Golden image does not exist: ${goldenPath}\n` +
        `Run with PLAYWRIGHT_UPDATE_SNAPSHOTS=1 to create it.`
      );
    }
  }

  const goldenBuffer = fs.readFileSync(goldenPath);
  const goldenPng = PNG.sync.read(goldenBuffer);

  if (
    actualPng.width !== goldenPng.width ||
    actualPng.height !== goldenPng.height
  ) {
    throw new Error(
      `Image dimensions do not match:\n` +
      `  Actual: ${actualPng.width}×${actualPng.height}\n` +
      `  Golden: ${goldenPng.width}×${goldenPng.height}`
    );
  }

  const { width, height } = actualPng;
  const diffPng = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    actualPng.data,
    goldenPng.data,
    diffPng.data,
    width,
    height,
    { threshold: 0.1 } // Internal pixelmatch threshold (0-1 scale)
  );

  const diffPercentage = numDiffPixels / (width * height);

  if (diffPercentage > threshold) {
    if (!fs.existsSync(diffDir)) {
      fs.mkdirSync(diffDir, { recursive: true });
    }
    
    const goldenFilename = path.basename(goldenPath);
    const diffPath = path.join(diffDir, `diff-${goldenFilename}`);
    const actualPath = path.join(diffDir, `actual-${goldenFilename}`);
    
    fs.writeFileSync(diffPath, PNG.sync.write(diffPng));
    fs.writeFileSync(actualPath, actualBuffer);

    throw new Error(
      `Visual regression detected: ${(diffPercentage * 100).toFixed(2)}% pixels differ (threshold: ${(threshold * 100).toFixed(2)}%)\n` +
      `  Golden: ${goldenPath}\n` +
      `  Actual: ${actualPath}\n` +
      `  Diff: ${diffPath}\n` +
      `Run with PLAYWRIGHT_UPDATE_SNAPSHOTS=1 to update the golden image if this change is intentional.`
    );
  }

  if (updateSnapshots && diffPercentage > 0) {
    fs.writeFileSync(goldenPath, actualBuffer);
    console.log(`Updated golden image: ${goldenPath} (${(diffPercentage * 100).toFixed(2)}% changed)`);
  }
}

/**
 * Waits for the page to be ready for screenshot.
 * Ensures camera animations have settled and rendering is complete.
 */
export async function waitForReady(page: any, timeout = 5000): Promise<void> {
  await page.waitForFunction(
    () => {
      if (typeof (window as any).__ready === 'boolean') {
        return (window as any).__ready === true;
      }
      return document.querySelector('canvas') !== null;
    },
    { timeout }
  );

  await page.evaluate(() => {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });
  });
}
