import { describe, expect, test } from 'vitest';
import { compareIssues, statusForIssues } from '../src/rules.js';
import type { ScreenIssue } from '../src/types.js';

function issue(id: string, severity: ScreenIssue['severity']): ScreenIssue {
  return {
    id,
    rule: id,
    severity,
    title: `${id} title`,
    message: `${id} message`,
    viewport: 'desktop',
    selector: 'body',
    help: 'Fix the issue.'
  };
}

describe('statusForIssues', () => {
  test('returns pass when no issues exist', () => {
    expect(statusForIssues([])).toBe('pass');
  });

  test('returns warn when warnings exist without errors', () => {
    expect(statusForIssues([issue('contrast', 'warning')])).toBe('warn');
  });

  test('returns fail when any error exists', () => {
    expect(statusForIssues([issue('overflow', 'warning'), issue('blank', 'error')])).toBe('fail');
  });
});

describe('compareIssues', () => {
  test('orders errors before warnings and info', () => {
    const sorted = [issue('info', 'info'), issue('error', 'error'), issue('warning', 'warning')].sort(compareIssues);

    expect(sorted.map((entry) => entry.severity)).toEqual(['error', 'warning', 'info']);
  });
});
