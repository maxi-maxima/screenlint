import { describe, expect, test } from 'vitest';
import { renderHtmlReport } from '../src/reporters/html.js';
import { renderJsonReport } from '../src/reporters/json.js';
import { renderMarkdownReport } from '../src/reporters/markdown.js';
import type { ScanResult } from '../src/types.js';

const result: ScanResult = {
  target: 'https://example.test',
  startedAt: '2026-06-09T00:00:00.000Z',
  finishedAt: '2026-06-09T00:00:01.000Z',
  status: 'fail',
  summary: {
    issueCount: 2,
    errorCount: 1,
    warningCount: 1,
    infoCount: 0,
    viewportCount: 1
  },
  viewports: [
    {
      name: 'mobile',
      width: 390,
      height: 844,
      screenshotPath: 'screenshots/mobile.png',
      metrics: {
        bodyTextLength: 42,
        documentWidth: 430,
        horizontalOverflow: 40,
        visibleElementCount: 12
      }
    }
  ],
  issues: [
    {
      id: 'mobile:horizontal-overflow:40',
      rule: 'horizontal-overflow',
      severity: 'error',
      title: 'Page overflows horizontally',
      message: 'The rendered document is 40px wider than the viewport.',
      viewport: 'mobile',
      selector: 'html',
      help: 'Constrain fixed-width sections and media.'
    },
    {
      id: 'mobile:low-contrast:button.primary',
      rule: 'low-contrast',
      severity: 'warning',
      title: 'Low text contrast',
      message: 'Contrast ratio is 2.1.',
      viewport: 'mobile',
      selector: 'button.primary',
      help: 'Increase foreground/background contrast.'
    }
  ]
};

describe('reporters', () => {
  test('renders stable json', () => {
    const parsed = JSON.parse(renderJsonReport(result)) as ScanResult;

    expect(parsed.status).toBe('fail');
    expect(parsed.issues).toHaveLength(2);
  });

  test('renders markdown with status, counts, and issue table', () => {
    const markdown = renderMarkdownReport(result);

    expect(markdown).toContain('# Screenlint Report');
    expect(markdown).toContain('Status: **FAIL**');
    expect(markdown).toContain('| Severity | Rule | Viewport | Selector |');
    expect(markdown).toContain('horizontal-overflow');
  });

  test('renders html with escaped issue content and screenshots', () => {
    const html = renderHtmlReport(result);

    expect(html).toContain('<title>Screenlint Report</title>');
    expect(html).toContain('Page overflows horizontally');
    expect(html).toContain('screenshots/mobile.png');
    expect(html).not.toContain('<script>');
  });
});
