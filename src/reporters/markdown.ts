import type { ScanResult, ScreenIssue } from '../types.js';

export function renderMarkdownReport(result: ScanResult): string {
  const lines = [
    '# Screenlint Report',
    '',
    `Status: **${result.status.toUpperCase()}**`,
    '',
    `Target: \`${result.target}\``,
    `Started: \`${result.startedAt}\``,
    `Finished: \`${result.finishedAt}\``,
    '',
    '## Summary',
    '',
    '| Metric | Count |',
    '| --- | ---: |',
    `| Viewports | ${result.summary.viewportCount} |`,
    `| Issues | ${result.summary.issueCount} |`,
    `| Errors | ${result.summary.errorCount} |`,
    `| Warnings | ${result.summary.warningCount} |`,
    `| Info | ${result.summary.infoCount} |`,
    '',
    '## Viewports',
    '',
    '| Viewport | Size | Document width | Overflow | Screenshot |',
    '| --- | ---: | ---: | ---: | --- |',
    ...result.viewports.map((viewport) =>
      `| ${escapeMarkdown(viewport.name)} | ${viewport.width}x${viewport.height} | ${viewport.metrics.documentWidth}px | ${viewport.metrics.horizontalOverflow}px | ${viewport.screenshotPath} |`
    ),
    '',
    '## Issues',
    ''
  ];

  if (result.issues.length === 0) {
    lines.push('No issues found.', '');
    return `${lines.join('\n')}\n`;
  }

  lines.push('| Severity | Rule | Viewport | Selector | Message | Help |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const issue of result.issues) {
    lines.push(issueRow(issue));
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
}

function issueRow(issue: ScreenIssue): string {
  return [
    issue.severity.toUpperCase(),
    issue.rule,
    issue.viewport,
    `\`${issue.selector}\``,
    issue.message,
    issue.help
  ]
    .map(escapeMarkdown)
    .join(' | ')
    .replace(/^/, '| ')
    .replace(/$/, ' |');
}

function escapeMarkdown(value: string | number): string {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
