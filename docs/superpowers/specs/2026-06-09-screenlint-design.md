# Screenlint Design

## Context

Recent open-source momentum is concentrated around AI coding agents, MCP, agent skills, and local developer tools that make generated code safer to ship. The user's existing repositories already cover MCP security drills, context-budget auditing, video generation, trading helpers, education data dashboards, proxy/admin tools, and API wrappers. This project therefore targets a nearby but non-duplicative problem: visual and DOM quality checks for AI-built frontends.

## Product

`screenlint` is a Node CLI that opens a URL or local HTML file in real browsers through Playwright and lints what was actually rendered. It catches failures static linters miss: blank pages, JavaScript console errors, broken images, horizontal overflow on mobile, text clipped inside controls, suspicious element overlap, and low text contrast. It writes JSON, Markdown, HTML, and screenshots so developers can use it locally, in pull requests, or in CI.

## Audience

Primary users are developers using Codex, Claude Code, Cursor, Copilot, v0, Bolt, Lovable, and similar agentic frontend flows. Their pain is not "does TypeScript compile"; it is "did the agent silently make a page that looks broken at 390px wide?"

## Scope

Version 0.1 focuses on one-command scanning:

- `screenlint scan <url-or-file>`
- desktop and mobile viewport presets
- deterministic issue model with severity, selector, viewport, and fix hint
- JSON, Markdown, and HTML reports
- full-page screenshots per viewport
- GitHub Action template
- demo target that needs no external app

Out of scope for v0.1: visual snapshot baselines, SaaS dashboards, browser extensions, AI calls, login workflows, and framework-specific plugins.

## Architecture

The CLI parses flags with Commander and validates scan options with Zod. The scanner module owns Playwright lifecycle and delegates in-page evaluation to focused rule modules. Reporters are pure functions that serialize a shared `ScanResult` model into JSON, Markdown, and HTML. Tests cover rule behavior and report output without requiring a network service.

## Success Criteria

- `npm run check` passes.
- `npm run demo` produces reports and screenshots.
- README explains the problem in under 30 seconds and offers copy-paste commands.
- The repository is public on GitHub with CI.
