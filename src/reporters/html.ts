import type { ScanResult, ScreenIssue } from '../types.js';

export function renderHtmlReport(result: ScanResult): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Screenlint Report</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f7fb;
      --panel: #ffffff;
      --text: #172033;
      --muted: #5f6c83;
      --line: #dce3ef;
      --error: #bd2b2b;
      --warning: #8a5b00;
      --info: #2459a6;
      --pass: #167247;
    }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    header, main {
      max-width: 1180px;
      margin: 0 auto;
      padding: 28px;
    }
    header {
      padding-top: 36px;
    }
    h1 {
      margin: 0 0 8px;
      font-size: 34px;
      line-height: 1.1;
    }
    h2 {
      margin: 0 0 14px;
      font-size: 20px;
    }
    .status {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 10px;
      border-radius: 6px;
      color: #fff;
      font-weight: 700;
      background: var(--info);
    }
    .status.pass { background: var(--pass); }
    .status.warn { background: var(--warning); }
    .status.fail { background: var(--error); }
    .meta {
      color: var(--muted);
      overflow-wrap: anywhere;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 12px;
      margin: 22px 0;
    }
    .metric, section {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
    }
    .metric {
      padding: 14px 16px;
    }
    .metric strong {
      display: block;
      font-size: 26px;
      line-height: 1.2;
    }
    .metric span {
      color: var(--muted);
      font-size: 13px;
    }
    section {
      margin: 18px 0;
      padding: 18px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      padding: 10px 8px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
    }
    th {
      color: var(--muted);
      font-weight: 700;
    }
    code {
      padding: 2px 5px;
      border-radius: 4px;
      background: #eef2f8;
      overflow-wrap: anywhere;
    }
    .badge {
      display: inline-block;
      min-width: 64px;
      padding: 2px 7px;
      border-radius: 5px;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      text-align: center;
    }
    .badge.error { background: var(--error); }
    .badge.warning { background: var(--warning); }
    .badge.info { background: var(--info); }
    .screens {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }
    figure {
      margin: 0;
    }
    figcaption {
      margin-bottom: 8px;
      color: var(--muted);
      font-size: 13px;
    }
    img {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fff;
    }
  </style>
</head>
<body>
  <header>
    <span class="status ${escapeHtml(result.status)}">${escapeHtml(result.status.toUpperCase())}</span>
    <h1>Screenlint Report</h1>
    <div class="meta">Target: <code>${escapeHtml(result.target)}</code></div>
    <div class="meta">Started: ${escapeHtml(result.startedAt)} · Finished: ${escapeHtml(result.finishedAt)}</div>
    <div class="grid">
      ${metric('Issues', result.summary.issueCount)}
      ${metric('Errors', result.summary.errorCount)}
      ${metric('Warnings', result.summary.warningCount)}
      ${metric('Viewports', result.summary.viewportCount)}
    </div>
  </header>
  <main>
    <section>
      <h2>Issues</h2>
      ${issuesTable(result.issues)}
    </section>
    <section>
      <h2>Viewports</h2>
      <table>
        <thead><tr><th>Name</th><th>Size</th><th>Document Width</th><th>Overflow</th><th>Visible Elements</th></tr></thead>
        <tbody>
          ${result.viewports
            .map(
              (viewport) => `<tr>
                <td>${escapeHtml(viewport.name)}</td>
                <td>${viewport.width}x${viewport.height}</td>
                <td>${viewport.metrics.documentWidth}px</td>
                <td>${viewport.metrics.horizontalOverflow}px</td>
                <td>${viewport.metrics.visibleElementCount}</td>
              </tr>`
            )
            .join('\n')}
        </tbody>
      </table>
    </section>
    <section>
      <h2>Screenshots</h2>
      <div class="screens">
        ${result.viewports
          .map(
            (viewport) => `<figure>
              <figcaption>${escapeHtml(viewport.name)} · ${viewport.width}x${viewport.height}</figcaption>
              <img src="${escapeHtml(viewport.screenshotPath)}" alt="${escapeHtml(viewport.name)} screenshot" />
            </figure>`
          )
          .join('\n')}
      </div>
    </section>
  </main>
</body>
</html>
`;
}

function metric(label: string, value: number): string {
  return `<div class="metric"><strong>${value}</strong><span>${escapeHtml(label)}</span></div>`;
}

function issuesTable(issues: ScreenIssue[]): string {
  if (issues.length === 0) {
    return '<p>No issues found.</p>';
  }

  return `<table>
    <thead><tr><th>Severity</th><th>Rule</th><th>Viewport</th><th>Selector</th><th>Title</th><th>Message</th><th>Help</th></tr></thead>
    <tbody>
      ${issues
        .map(
          (issue) => `<tr>
            <td><span class="badge ${escapeHtml(issue.severity)}">${escapeHtml(issue.severity.toUpperCase())}</span></td>
            <td>${escapeHtml(issue.rule)}</td>
            <td>${escapeHtml(issue.viewport)}</td>
            <td><code>${escapeHtml(issue.selector)}</code></td>
            <td>${escapeHtml(issue.title)}</td>
            <td>${escapeHtml(issue.message)}</td>
            <td>${escapeHtml(issue.help)}</td>
          </tr>`
        )
        .join('\n')}
    </tbody>
  </table>`;
}

function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
