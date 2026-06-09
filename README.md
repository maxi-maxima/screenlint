<div align="center">

# Screenlint

**Lint what the browser actually rendered.**

A Playwright-powered UI QA gate for AI-built frontends.

[简体中文](README.zh-CN.md)

</div>

AI coding agents are excellent at producing React, Vue, HTML, and Tailwind fast. They are also excellent at accidentally shipping screens that compile but look broken:

- blank routes after hydration fails
- mobile pages wider than the viewport
- clipped button labels
- overlapping absolute-positioned panels
- low-contrast text
- broken remote images
- noisy runtime console errors

`screenlint` opens the page in Chromium, inspects the rendered DOM, takes screenshots, and writes JSON, Markdown, and HTML reports.

No API keys. No cloud account. No visual baseline setup.

## 30 Second Demo

```bash
npx screenlint demo
```

The demo creates an intentionally broken local page and writes:

```text
reports/demo/screenlint.json
reports/demo/screenlint.md
reports/demo/screenlint.html
reports/demo/screenshots/desktop.png
reports/demo/screenshots/mobile.png
```

## Scan A Page

```bash
npx screenlint scan http://localhost:3000 --out reports/screenlint
```

Scan a local HTML file:

```bash
npx screenlint scan ./dist/index.html --viewport mobile
```

Use it as a CI gate:

```bash
npx screenlint scan http://localhost:3000 --fail-on error
```

Exit codes:

| Code | Meaning |
| ---: | --- |
| `0` | scan completed and did not cross the configured failure level |
| `1` | UI issue crossed `--fail-on` |
| `2` | CLI/configuration error |

## Rules

| Rule | Severity | What it catches |
| --- | --- | --- |
| `blank-page` | error | A route with almost no visible content |
| `console-error` | error | Browser console errors emitted during load |
| `page-error` | error | Unhandled runtime exceptions |
| `broken-image` | error | Images that failed to render |
| `horizontal-overflow` | error | Mobile or desktop layouts wider than the viewport |
| `text-clipped` | warning | Text larger than its visible box |
| `element-overlap` | warning | Suspicious overlap between positioned elements |
| `low-contrast` | warning | Text contrast below a practical threshold |

The rules are intentionally pragmatic. `screenlint` is not a replacement for full accessibility, unit, or visual-regression suites. It is a fast rendered-page smoke test for the failures AI agents most often miss.

## GitHub Actions

Copy `templates/github-action.yml` into `.github/workflows/screenlint.yml`.

```yaml
- name: Scan rendered UI
  run: npx screenlint scan http://127.0.0.1:3000 --out reports/screenlint --fail-on error
```

Upload the report artifact:

```yaml
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: screenlint-report
    path: reports/screenlint
```

## Why It Exists

Agentic frontend development changed the failure mode. The code usually builds. The real question is whether the generated screen is usable after the browser renders it.

Static tools see source code. `screenlint` sees the page your user sees.

## Development

```bash
npm install
npm run check
npm run demo
```

## Research Context

This project is shaped by three current movements:

- AI coding agents and repository instructions are becoming a normal development surface.
- Browser automation through Playwright is reliable enough to become a local quality gate.
- Teams need small, copy-pasteable tools that catch agent mistakes before review.

## License

MIT
