import type { IssueSeverity, ScanStatus, ScreenIssue } from './types.js';

const severityRank: Record<IssueSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2
};

export function compareIssues(a: ScreenIssue, b: ScreenIssue): number {
  const severityDelta = severityRank[a.severity] - severityRank[b.severity];
  if (severityDelta !== 0) {
    return severityDelta;
  }

  const viewportDelta = a.viewport.localeCompare(b.viewport);
  if (viewportDelta !== 0) {
    return viewportDelta;
  }

  return a.rule.localeCompare(b.rule);
}

export function statusForIssues(issues: ScreenIssue[]): ScanStatus {
  if (issues.some((issue) => issue.severity === 'error')) {
    return 'fail';
  }

  if (issues.some((issue) => issue.severity === 'warning')) {
    return 'warn';
  }

  return 'pass';
}

export function issueSummary(issues: ScreenIssue[], viewportCount: number) {
  return {
    issueCount: issues.length,
    errorCount: issues.filter((issue) => issue.severity === 'error').length,
    warningCount: issues.filter((issue) => issue.severity === 'warning').length,
    infoCount: issues.filter((issue) => issue.severity === 'info').length,
    viewportCount
  };
}
