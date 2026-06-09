import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, type Browser, type ConsoleMessage, type Page } from 'playwright';
import { compareIssues, issueSummary, statusForIssues } from './rules.js';
import type { ScanOptions, ScreenIssue, ViewportMetrics, ViewportResult } from './types.js';

interface PageProbeResult {
  metrics: ViewportMetrics;
  issues: Omit<ScreenIssue, 'viewport'>[];
}

export const defaultViewports = [
  { name: 'desktop', width: 1440, height: 960 },
  { name: 'mobile', width: 390, height: 844 }
] as const;

export async function scanTarget(options: ScanOptions) {
  const startedAt = new Date().toISOString();
  await mkdir(resolve(options.outDir, 'screenshots'), { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: browserExecutablePath()
  });
  try {
    const allIssues: ScreenIssue[] = [];
    const viewports: ViewportResult[] = [];
    const targetUrl = normalizeTarget(options.target);

    for (const viewport of options.viewports) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1
      });

      const viewportIssues = await scanViewport(browser, page, targetUrl, options, viewport.name);
      allIssues.push(...viewportIssues.issues);
      viewports.push({
        ...viewport,
        screenshotPath: viewportIssues.screenshotPath,
        metrics: viewportIssues.metrics
      });
      await page.close();
    }

    const issues = allIssues.sort(compareIssues);
    const finishedAt = new Date().toISOString();
    return {
      target: options.target,
      startedAt,
      finishedAt,
      status: statusForIssues(issues),
      summary: issueSummary(issues, options.viewports.length),
      viewports,
      issues
    };
  } finally {
    await browser.close();
  }
}

async function scanViewport(
  browser: Browser,
  page: Page,
  targetUrl: string,
  options: ScanOptions,
  viewportName: string
) {
  void browser;
  const runtimeIssues: ScreenIssue[] = [];

  page.on('console', (message) => {
    const issue = issueFromConsole(message, viewportName);
    if (issue) {
      runtimeIssues.push(issue);
    }
  });

  page.on('pageerror', (error) => {
    runtimeIssues.push({
      id: `${viewportName}:page-error:${runtimeIssues.length}`,
      rule: 'page-error',
      severity: 'error',
      title: 'Unhandled page error',
      message: error.message,
      viewport: viewportName,
      selector: 'window',
      help: 'Fix the runtime exception before shipping this screen.'
    });
  });

  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: options.timeoutMs });
  const probe = await page.evaluate(runPageProbe);
  const screenshotPath = resolve(options.outDir, 'screenshots', `${safeName(viewportName)}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  return {
    screenshotPath: relative(options.outDir, screenshotPath).replaceAll('\\', '/'),
    metrics: probe.metrics,
    issues: [
      ...runtimeIssues,
      ...probe.issues.map((issue) => ({
        ...issue,
        viewport: viewportName,
        id: `${viewportName}:${issue.id}`
      }))
    ]
  };
}

function issueFromConsole(message: ConsoleMessage, viewport: string): ScreenIssue | null {
  if (message.type() !== 'error') {
    return null;
  }

  return {
    id: `${viewport}:console-error:${message.text().slice(0, 48)}`,
    rule: 'console-error',
    severity: 'error',
    title: 'Console error',
    message: message.text(),
    viewport,
    selector: 'console',
    help: 'Open the browser console and fix the reported runtime error.'
  };
}

function normalizeTarget(target: string): string {
  if (/^https?:\/\//i.test(target) || target.startsWith('file://')) {
    return target;
  }

  const absolute = isAbsolute(target) ? target : resolve(process.cwd(), target);
  return pathToFileURL(absolute).toString();
}

function safeName(value: string): string {
  return value.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'viewport';
}

function browserExecutablePath(): string | undefined {
  if (process.env.SCREENLINT_BROWSER_PATH && existsSync(process.env.SCREENLINT_BROWSER_PATH)) {
    return process.env.SCREENLINT_BROWSER_PATH;
  }

  if (process.platform !== 'win32') {
    return undefined;
  }

  const candidates = [
    process.env.ProgramFiles ? `${process.env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe` : '',
    process.env['ProgramFiles(x86)'] ? `${process.env['ProgramFiles(x86)']}\\Google\\Chrome\\Application\\chrome.exe` : '',
    process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe` : '',
    process.env.ProgramFiles ? `${process.env.ProgramFiles}\\Microsoft\\Edge\\Application\\msedge.exe` : '',
    process.env['ProgramFiles(x86)'] ? `${process.env['ProgramFiles(x86)']}\\Microsoft\\Edge\\Application\\msedge.exe` : ''
  ];

  return candidates.find((candidate) => candidate.length > 0 && existsSync(candidate));
}

function runPageProbe(): PageProbeResult {
  const viewportWidth = window.innerWidth;
  const documentWidth = Math.max(
    document.documentElement.scrollWidth,
    document.body?.scrollWidth ?? 0,
    document.documentElement.clientWidth
  );

  const visibleElements = Array.from(document.querySelectorAll<HTMLElement>('body *')).filter(isVisible);
  const issues: Omit<ScreenIssue, 'viewport'>[] = [];
  const textLength = (document.body?.innerText ?? '').trim().length;

  if (visibleElements.length < 2 || textLength < 12) {
    issues.push({
      id: 'blank-page',
      rule: 'blank-page',
      severity: 'error',
      title: 'Page appears blank',
      message: `Only ${visibleElements.length} visible elements and ${textLength} text characters were found.`,
      selector: 'body',
      help: 'Check routing, failed hydration, and full-screen loaders.'
    });
  }

  const overflow = documentWidth - viewportWidth;
  if (overflow > 8) {
    issues.push({
      id: `horizontal-overflow:${overflow}`,
      rule: 'horizontal-overflow',
      severity: 'error',
      title: 'Page overflows horizontally',
      message: `The rendered document is ${overflow}px wider than the viewport.`,
      selector: 'html',
      help: 'Constrain fixed-width containers, tables, media, and absolute-positioned elements.',
      evidence: { documentWidth, viewportWidth, overflow }
    });
  }

  for (const image of Array.from(document.images)) {
    if (image.complete && image.naturalWidth === 0) {
      issues.push({
        id: `broken-image:${cssPath(image)}`,
        rule: 'broken-image',
        severity: 'error',
        title: 'Broken image',
        message: `Image failed to render: ${image.currentSrc || image.src || image.getAttribute('src') || 'unknown source'}`,
        selector: cssPath(image),
        help: 'Verify asset paths and remote image permissions.'
      });
    }
  }

  for (const element of visibleElements) {
    const clip = clippedTextIssue(element);
    if (clip) {
      issues.push(clip);
    }

    const contrast = contrastIssue(element);
    if (contrast) {
      issues.push(contrast);
    }
  }

  issues.push(...overlapIssues(visibleElements));

  return {
    metrics: {
      bodyTextLength: textLength,
      documentWidth,
      horizontalOverflow: Math.max(0, overflow),
      visibleElementCount: visibleElements.length
    },
    issues: dedupeIssues(issues)
  };

  function isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return (
      style.visibility !== 'hidden' &&
      style.display !== 'none' &&
      Number.parseFloat(style.opacity) > 0.02 &&
      rect.width > 1 &&
      rect.height > 1
    );
  }

  function clippedTextIssue(element: HTMLElement): Omit<ScreenIssue, 'viewport'> | null {
    const text = (element.innerText ?? '').trim();
    if (text.length < 12) {
      return null;
    }

    const style = window.getComputedStyle(element);
    const clipsX = element.scrollWidth - element.clientWidth > 3;
    const clipsY = element.scrollHeight - element.clientHeight > 3;
    const clipsOverflow = ['hidden', 'clip'].includes(style.overflow) || ['hidden', 'clip'].includes(style.overflowX);

    if (!clipsOverflow || (!clipsX && !clipsY)) {
      return null;
    }

    return {
      id: `text-clipped:${cssPath(element)}`,
      rule: 'text-clipped',
      severity: 'warning',
      title: 'Text may be clipped',
      message: `Text content is larger than the visible box on ${cssPath(element)}.`,
      selector: cssPath(element),
      help: 'Let the control grow, wrap the label, or reduce fixed dimensions.',
      evidence: {
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight
      }
    };
  }

  function contrastIssue(element: HTMLElement): Omit<ScreenIssue, 'viewport'> | null {
    const text = (element.innerText ?? '').trim();
    if (text.length < 2 || element.children.length > 3) {
      return null;
    }

    const style = window.getComputedStyle(element);
    const foreground = parseRgb(style.color);
    const background = effectiveBackground(element);
    if (!foreground || !background) {
      return null;
    }

    const ratio = contrastRatio(foreground, background);
    if (ratio >= 3) {
      return null;
    }

    return {
      id: `low-contrast:${cssPath(element)}`,
      rule: 'low-contrast',
      severity: 'warning',
      title: 'Low text contrast',
      message: `Text contrast ratio is ${ratio.toFixed(2)} on ${cssPath(element)}.`,
      selector: cssPath(element),
      help: 'Increase the difference between text and background colors.',
      evidence: { ratio: Number(ratio.toFixed(2)) }
    };
  }

  function overlapIssues(elements: HTMLElement[]): Omit<ScreenIssue, 'viewport'>[] {
    const positioned = elements
      .map((element) => ({ element, rect: element.getBoundingClientRect(), style: window.getComputedStyle(element) }))
      .filter((entry) => entry.rect.width >= 32 && entry.rect.height >= 16)
      .filter((entry) => ['absolute', 'fixed', 'sticky'].includes(entry.style.position));

    const found: Omit<ScreenIssue, 'viewport'>[] = [];
    for (let index = 0; index < positioned.length; index += 1) {
      for (let otherIndex = index + 1; otherIndex < positioned.length; otherIndex += 1) {
        const first = positioned[index];
        const second = positioned[otherIndex];
        if (!first || !second) {
          continue;
        }

        const overlapArea = rectOverlapArea(first.rect, second.rect);
        const smallerArea = Math.min(first.rect.width * first.rect.height, second.rect.width * second.rect.height);
        if (smallerArea > 0 && overlapArea / smallerArea > 0.25) {
          found.push({
            id: `element-overlap:${cssPath(first.element)}:${cssPath(second.element)}`,
            rule: 'element-overlap',
            severity: 'warning',
            title: 'Positioned elements overlap',
            message: `${cssPath(first.element)} overlaps ${cssPath(second.element)} by ${Math.round(overlapArea)}px2.`,
            selector: cssPath(first.element),
            help: 'Review absolute/fixed positioning at this viewport.',
            evidence: { overlapArea: Math.round(overlapArea) }
          });
        }
      }
    }
    return found.slice(0, 8);
  }

  function rectOverlapArea(a: DOMRect, b: DOMRect): number {
    const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return width * height;
  }

  function effectiveBackground(element: HTMLElement): [number, number, number] | null {
    let current: HTMLElement | null = element;
    while (current) {
      const color = parseRgb(window.getComputedStyle(current).backgroundColor);
      if (color) {
        return color;
      }
      current = current.parentElement;
    }
    return [255, 255, 255];
  }

  function parseRgb(value: string): [number, number, number] | null {
    const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) {
      return null;
    }

    const alpha = match[4] === undefined ? 1 : Number.parseFloat(match[4]);
    if (alpha < 0.1) {
      return null;
    }

    return [Number(match[1]), Number(match[2]), Number(match[3])];
  }

  function contrastRatio(foreground: [number, number, number], background: [number, number, number]): number {
    const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
    const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
    return (lighter + 0.05) / (darker + 0.05);
  }

  function relativeLuminance(rgb: [number, number, number]): number {
    const [red, green, blue] = rgb.map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  }

  function cssPath(element: Element): string {
    if (element.id) {
      return `#${CSS.escape(element.id)}`;
    }

    const parts: string[] = [];
    let current: Element | null = element;
    while (current && current !== document.body && parts.length < 4) {
      const tag = current.tagName.toLowerCase();
      const className = Array.from(current.classList).slice(0, 2).map((item) => `.${CSS.escape(item)}`).join('');
      const parent = current.parentElement;
      const sameTagSiblings = parent ? Array.from(parent.children).filter((child) => child.tagName === current?.tagName) : [];
      const nth = sameTagSiblings.length > 1 ? `:nth-of-type(${sameTagSiblings.indexOf(current) + 1})` : '';
      parts.unshift(`${tag}${className}${nth}`);
      current = current.parentElement;
    }
    return parts.join(' > ') || element.tagName.toLowerCase();
  }

  function dedupeIssues(input: Omit<ScreenIssue, 'viewport'>[]): Omit<ScreenIssue, 'viewport'>[] {
    const seen = new Set<string>();
    const output: Omit<ScreenIssue, 'viewport'>[] = [];
    for (const issue of input) {
      const key = `${issue.rule}:${issue.selector}:${issue.title}`;
      if (!seen.has(key)) {
        seen.add(key);
        output.push(issue);
      }
    }
    return output;
  }
}
