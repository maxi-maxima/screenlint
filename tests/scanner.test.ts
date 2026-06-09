import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { createDemoHtml } from '../src/demo.js';
import { scanTarget } from '../src/scanner.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
});

async function tempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'screenlint-'));
  tempDirs.push(dir);
  return dir;
}

describe('scanTarget', () => {
  test('detects rendered UI problems in the demo page', async () => {
    const outDir = await tempDir();
    const demo = await createDemoHtml(outDir);

    const result = await scanTarget({
      target: demo,
      outDir,
      viewports: [{ name: 'mobile', width: 390, height: 844 }],
      timeoutMs: 10000
    });

    expect(result.status).toBe('fail');
    expect(result.summary.errorCount).toBeGreaterThan(0);
    expect(result.issues.map((item) => item.rule)).toEqual(
      expect.arrayContaining(['console-error', 'broken-image', 'horizontal-overflow'])
    );
    expect(result.viewports[0]?.screenshotPath).toContain('screenshots');
  });
});
