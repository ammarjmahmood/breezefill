# BreezeFill Launch Guide

If you want the shortest, most beginner-friendly version, open [START_HERE.md](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/START_HERE.md) first.

## 1. Make the repo easy for anyone to install

The easiest path right now is:

1. Push the repo to GitHub.
2. Keep the extension root exactly as it is.
3. Tell users to download the repo ZIP and load it unpacked in Chrome.

Important detail:

- People do **not** need to run `npm install` just to use the extension.
- `npm install` is only for tests, screenshots, and release scripts.

The direct download link for this repo is:

`https://github.com/ammarjmahmood/breezefill/archive/refs/heads/main.zip`

## 2. Give the repo a clean install path

Put this in the repo description and website:

1. Download BreezeFill from GitHub.
2. Unzip the folder.
3. Open `chrome://extensions`.
4. Turn on `Developer mode`.
5. Click `Load unpacked`.
6. Select the BreezeFill folder.
7. Open BreezeFill settings and add your profile.

## 3. Turn the repo into a live website on Vercel

This repo now includes a launch site in [docs/index.html](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/docs/index.html) and a hosted privacy page in [docs/privacy/index.html](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/docs/privacy/index.html).

The repo now also includes [vercel.json](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/vercel.json), which makes Vercel serve:

- `/` → the launch homepage
- `/privacy` → the hosted privacy policy
- `/assets/*` → the marketing assets and screenshots

To publish it on Vercel:

1. Go to the Vercel dashboard.
2. Click `Add New...` → `Project`.
3. Import `ammarjmahmood/breezefill` from GitHub.
4. Keep the root directory as the repo root.
5. Do not add a build command. This site is static.
6. Deploy.

Once that’s live, you’ll get a Vercel URL like:

- `https://breezefill.vercel.app/`

Use that as:

- your launch website
- your Product Hunt website link
- your Chrome Web Store official/support link if you want

Use the privacy page URL:

- `https://your-vercel-domain/privacy`

for the Chrome Web Store privacy-policy field.

## 3B. If you want GitHub Pages instead

Vercel is the cleaner launch path now, but GitHub Pages still works.

1. Open the GitHub repo.
2. Go to `Settings`.
3. Open `Pages`.
4. Choose `Deploy from a branch`.
5. Select branch `main`.
6. Select folder `/docs`.
7. Save.

Your URLs will be:

- `https://ammarjmahmood.github.io/breezefill/`
- `https://ammarjmahmood.github.io/breezefill/privacy/`

## 4. Put it on the Chrome Web Store

The Chrome package is already generated at:

- [dist/chrome/breezefill-chrome-web-store-v0.1.0.zip](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/dist/chrome/breezefill-chrome-web-store-v0.1.0.zip)

Supporting launch assets are already prepared in:

- [store/chrome](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/store/chrome)

Upload flow:

1. Go to the Chrome Web Store Developer Dashboard.
2. Click `Add new item`.
3. Upload the ZIP from `dist/chrome/`.
4. Paste the copy from [store/chrome/listing.md](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/store/chrome/listing.md).
5. Upload the screenshots from [store/chrome/screenshots](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/store/chrome/screenshots).
6. Upload the promo tile from [store/chrome/promo](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/store/chrome/promo).
7. Use the privacy policy URL from the Vercel site.
8. Use [store/chrome/review-notes.md](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/store/chrome/review-notes.md) for reviewer notes and permission justifications.

## 5. Best way to ship this on Product Hunt

The official Product Hunt launch guide says:

- the best day to launch is the day you’re most prepared
- `12:01 am Pacific Time` is the best time if you’re planning ahead
- you can schedule a launch in advance
- company accounts are not allowed; launch from a maker account

Official sources:

- [Product Hunt Launch Guide](https://www.producthunt.com/launch/)
- [How to schedule a post](https://help.producthunt.com/en/articles/2724119-how-to-schedule-a-post)

Recommended BreezeFill launch sequence:

1. Make the Vercel launch site live first.
2. Make the Chrome Web Store listing live or at least under review with the final URL ready.
3. Update the install button in [docs/app.js](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/docs/app.js) with the real Chrome Web Store link.
4. Schedule the Product Hunt launch for a day you can be online and responsive the whole time.
5. Use the Vercel homepage as the Product Hunt website link.
6. Use the real extension screenshots as your gallery.
7. Be ready with a thoughtful first comment that explains why you built it and who it’s for.

## 6. Product Hunt draft copy

### Name

BreezeFill

### Tagline

Autofill that feels invisible until you need it

### Short pitch

BreezeFill quietly suggests your saved details on forms and remembers new responses only when you say yes.

### First comment draft

Hey everyone, I built BreezeFill because filling the same forms over and over still feels way too clunky.

The goal was to make autofill feel calm and almost native:

- quiet suggestions instead of noisy menus
- save prompts only after you finish a form
- local browser storage instead of a sync-heavy setup
- better support for real application forms, including internships and job boards

If you try it, I’d especially love feedback on where it still feels too loud or where a form doesn’t match correctly yet.

## 7. What to update right before launch day

1. Replace the contact text in the privacy policy with your real support email or website.
2. Add the real Chrome Web Store URL in [docs/app.js](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/docs/app.js).
3. Re-run:

```bash
npm run release:chrome
```

4. Push the updated repo.
5. Confirm the Vercel site still looks correct after deployment.
