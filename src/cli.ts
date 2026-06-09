#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Command } from 'commander';
import pc from 'picocolors';
import { z } from 'zod';
import { createDemoHtml } from './demo.js';
import { renderHtmlReport } from './reporters/html.js';
import { renderJsonReport } from './reporters/json.js';
import { renderMarkdownReport } from './reporters/markdown.js';
import { defaultViewports, scanTarget } from './scanner.js';
import type { ScanResult, ViewportConfig } from './types.js';

const failOnSchema = z.enum(['error', 'warning', 'never']);

const program = new Command()
  .name('screenlint')
  .description('Lint what the browser actually rendered.')
  .version('0.1.0');

program
  .command('scan')
  .argument('<target>', 'URL or local HTML file to scan')
  .option('-o, --out <dir>', 'report output directory', 'reports/screenlint')
  .option('--timeout <ms>', 'navigation timeout in milliseconds', parseInteger, 15000)
  .option('--viewport <preset>', 'viewport preset: all, desktop, mobile', 'all')
  .option('--fail-on <level>', 'exit non-zero on: error, warning, never', 'error')
  .action(async (target: string, rawOptions: CliOptions) => {
    await runScan(target, rawOptions);
  });

program
  .command('demo')
  .option('-o, --out <dir>', 'report output directory', 'reports/demo')
  .option('--fail-on <level>', 'exit non-zero on: error, warning, never', 'never')
  .description('Generate and scan a local demo page with intentional UI problems')
  .action(async (rawOptions: CliOptions) => {
    const outDir = resolve(rawOptions.out);
    const demoTarget = await createDemoHtml(outDir);
    await runScan(demoTarget, { ...rawOptions, out: outDir, viewport: 'all', timeout: 15000 });
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(pc.red(`screenlint: ${message}`));
  process.exitCode = 2;
});

interface CliOptions {
  out: string;
  timeout?: number;
  viewport?: string;
  failOn: string;
}

async function runScan(target: string, rawOptions: CliOptions): Promise<void> {
  const outDir = resolve(rawOptions.out);
  const failOn = failOnSchema.parse(rawOptions.failOn);
  const viewports = parseViewports(rawOptions.viewport ?? 'all');

  await mkdir(outDir, { recursive: true });
  const result = await scanTarget({
    target,
    outDir,
    viewports,
    timeoutMs: rawOptions.timeout ?? 15000
  });
  await writeReports(outDir, result);
  printSummary(outDir, result);
  process.exitCode = exitCodeFor(result, failOn);
}

async function writeReports(outDir: string, result: ScanResult): Promise<void> {
  await Promise.all([
    writeFile(resolve(outDir, 'screenlint.json'), renderJsonReport(result), 'utf8'),
    writeFile(resolve(outDir, 'screenlint.md'), renderMarkdownReport(result), 'utf8'),
    writeFile(resolve(outDir, 'screenlint.html'), renderHtmlReport(result), 'utf8')
  ]);
}

function parseViewports(preset: string): ViewportConfig[] {
  if (preset === 'all') {
    return [...defaultViewports];
  }
  const match = defaultViewports.find((viewport) => viewport.name === preset);
  if (!match) {
    throw new Error(`Unknown viewport preset "${preset}". Use all, desktop, or mobile.`);
  }
  return [match];
}

function exitCodeFor(result: ScanResult, failOn: z.infer<typeof failOnSchema>): number {
  if (failOn === 'never') {
    return 0;
  }
  if (failOn === 'warning') {
    return result.summary.errorCount > 0 || result.summary.warningCount > 0 ? 1 : 0;
  }
  return result.summary.errorCount > 0 ? 1 : 0;
}

function printSummary(outDir: string, result: ScanResult): void {
  const status =
    result.status === 'fail' ? pc.red(result.status.toUpperCase()) : result.status === 'warn' ? pc.yellow('WARN') : pc.green('PASS');
  console.log(`Screenlint ${status}`);
  console.log(`Target: ${result.target}`);
  console.log(`Issues: ${result.summary.issueCount} (${result.summary.errorCount} errors, ${result.summary.warningCount} warnings)`);
  console.log(`Reports: ${resolve(outDir, 'screenlint.html')}`);
}

function parseInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer, got "${value}".`);
  }
  return parsed;
}
