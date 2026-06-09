# Screenlint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a publishable TypeScript CLI that scans rendered web pages for AI-agent UI regressions.

**Architecture:** Keep the Playwright scanner, issue rules, and reporters separate. Rules return structured issues; reporters serialize the same model to JSON, Markdown, and HTML.

**Tech Stack:** Node 20+, TypeScript, Playwright, Commander, Zod, Vitest, ESLint.

---

### Task 1: Data Model And Rule Engine

**Files:**
- Create: `src/types.ts`
- Create: `src/rules.ts`
- Test: `tests/rules.test.ts`

- [x] Define the shared issue, viewport, and result types.
- [x] Add severity scoring and status helpers.
- [x] Unit-test status calculation and issue sorting.

### Task 2: Scanner

**Files:**
- Create: `src/scanner.ts`
- Create: `src/demo.ts`
- Test: `tests/scanner.test.ts`

- [x] Create demo HTML fixture generation.
- [x] Launch Chromium with desktop and mobile viewports.
- [x] Collect console errors, page errors, broken images, blank page signals, overflow, clipping, overlap, and contrast.
- [x] Save screenshots per viewport.

### Task 3: Reporters

**Files:**
- Create: `src/reporters/json.ts`
- Create: `src/reporters/markdown.ts`
- Create: `src/reporters/html.ts`
- Test: `tests/reporters.test.ts`

- [x] Serialize stable JSON.
- [x] Render a concise Markdown report.
- [x] Render a self-contained HTML report with screenshots.

### Task 4: CLI And Docs

**Files:**
- Create: `src/cli.ts`
- Create: `README.md`
- Create: `README.zh-CN.md`
- Create: `.github/workflows/ci.yml`
- Create: `templates/github-action.yml`

- [x] Implement `screenlint scan <target>` and `screenlint demo`.
- [x] Write English and Chinese docs.
- [x] Add CI and a reusable GitHub Action template.

### Task 5: Verification And Release Hygiene

**Files:**
- Modify: `package.json`
- Create: `CHANGELOG.md`
- Create: `CONTRIBUTING.md`
- Create: `SECURITY.md`

- [x] Run `npm install`.
- [x] Run `npm run check`.
- [x] Run `npm run demo`.
- [x] Initialize git, commit, create public GitHub repository, and push.
