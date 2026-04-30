# QA Guide

## Goal

BreezeFill should feel seamless on normal web forms and hit a practical support target of roughly 90% across standard desktop browser pages.

That target means:

- common text, email, phone, URL, textarea, and native select fields work
- forms inside iframes and open shadow DOM work
- major applicant-tracking systems work through the shared adapter layer
- save prompts appear after form interaction instead of interrupting typing

It does not mean literal 100% coverage across browser-protected pages, closed shadow DOM, canvas-driven UIs, or native mobile app screens.

## Test Commands

```bash
npm run check
npm run test:e2e
```

For a headless attempt on Chromium:

```bash
npm run test:e2e:headless
```

## Release Gate

Before calling BreezeFill launch-ready:

- `npm run check` passes
- the Playwright suite passes
- the manual matrix in [site-matrix.md](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/qa/site-matrix.md) is run on the current candidate
- every P0 or P1 autofill failure is either fixed or explicitly accepted
- Chrome manual install is verified
- Safari packaging is regenerated and smoke-tested

## Manual Sweep

Run the matrix in [site-matrix.md](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/qa/site-matrix.md) across at least:

- one marketing/contact form
- one SaaS signup or profile form
- one checkout/contact form
- one embedded iframe form
- one shadow-DOM-heavy app
- one public job application page for each major ATS family we support

## Evidence

Record results in [results-template.md](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/qa/results-template.md) for each release pass.
