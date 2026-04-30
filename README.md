# BreezeFill

BreezeFill is a polished browser extension that suggests autofill values while users type and asks whether new form responses should be saved for later.

## What it does

- Suggests autofill responses on text-like form fields.
- Uses profile values for common fields like name, email, phone, address, company, and website.
- Learns site-specific answers and can reuse them the next time the same field shows up.
- Prompts before saving new responses, so the extension stays predictable.
- Lets users manage everything from a compact popup and a fuller settings page.
- Handles iframes, open shadow DOM, native selects, and a shared adapter layer for major job application platforms.

## Project structure

- `manifest.json`: Manifest V3 extension entrypoint.
- `background.js`: Initializes defaults and handles save / mute messages.
- `content-script.js`: Detects form fields, shows suggestions, and displays save prompts.
- `content-styles.css`: In-page UI styling for suggestion menus, prompts, and toast messages.
- `popup.*`: Small control surface for quick profile edits and extension toggles.
- `options.*`: Full settings page for profile fields, behavior, and saved response management.
- `assets/`: Brand mark and packaged toolbar icons.
- `lib/`: Shared constants, field matching heuristics, and storage utilities.
- `tests/`: Playwright browser tests for the unpacked extension.
- `scripts/`: Local test server and Safari packaging helpers.
- `qa/`: Manual QA matrix and release templates.

## Fast install

If someone just wants to use BreezeFill in Chrome right now:

1. Download the repo ZIP from GitHub.
2. Unzip it.
3. Open `chrome://extensions`.
4. Turn on **Developer mode**.
5. Click **Load unpacked**.
6. Select the BreezeFill folder.

Important:

- no build step is required for install
- `npm install` is only needed for tests and release tooling

## Local verification

Run the syntax check:

```bash
npm run check
```

Run the extension browser suite:

```bash
npm run test:e2e
```

That suite covers:

- profile-backed suggestions
- native select suggestions
- save prompts and remembered values
- shadow DOM inputs
- ATS-style application markup via the shared adapter layer

## Local test page

Start the local server:

```bash
npm run test:server
```

Then open:

- [http://127.0.0.1:4173/test-form.html](http://127.0.0.1:4173/test-form.html)
- [http://127.0.0.1:4173/test-form.html?ashby_jid=demo](http://127.0.0.1:4173/test-form.html?ashby_jid=demo)
- [http://127.0.0.1:4173/docs/](http://127.0.0.1:4173/docs/)

If you only want to preview the launch site and docs locally, `npm run site:preview` uses the same static server.

The second URL activates the application-form adapter path on the local fixture page.

## Install in Safari

The core code is written as a standard Web Extension, so the same project can be converted for Safari:

```bash
npm run safari:convert
```

More details are in [SAFARI.md](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/SAFARI.md).

## Launch site

This repo includes a Vercel-ready launch site in [docs/index.html](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/docs/index.html) plus a hosted privacy page in [docs/privacy/index.html](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/docs/privacy/index.html).

It is now also Vercel-ready through [vercel.json](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/vercel.json).

Fastest deployment path:

1. Push the repo to GitHub.
2. Import the repo into Vercel.
3. Keep the repo root as the project root.
4. Do not add a build command.
5. Deploy.

That gives you a clean public website for launches and a privacy-policy URL for the Chrome Web Store at `/privacy`.

## Launch plan

The repo now also includes a practical launch guide in [LAUNCH.md](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/LAUNCH.md) covering:

- the easiest GitHub install path
- Vercel deployment
- Chrome Web Store submission
- Product Hunt launch timing and copy

## QA target

The project now includes a release-oriented QA plan in [qa/README.md](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/qa/README.md), a cross-site matrix in [qa/site-matrix.md](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/qa/site-matrix.md), and a reusable results log in [qa/results-template.md](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/qa/results-template.md).
