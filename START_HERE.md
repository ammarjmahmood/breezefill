# Start Here

This is the easiest possible setup guide for BreezeFill.

## 1. If you just want to use BreezeFill in Chrome right now

Direct download:

[Download the latest BreezeFill ZIP](https://github.com/ammarjmahmood/breezefill/archive/refs/heads/main.zip)

Then:

1. Download the ZIP.
2. Unzip it.
3. Open `chrome://extensions` in Chrome.
4. Turn on `Developer mode`.
5. Click `Load unpacked`.
6. Select the unzipped folder you just downloaded. GitHub will usually name it `breezefill-main`.
7. Open the BreezeFill extension.
8. Click `Open full settings`.
9. Add your name, email, phone, LinkedIn, school, or anything else you want saved.

That is it.

Important:

- You do **not** need to run `npm install` to use the extension.
- `npm install` is only for tests, packaging, and launch tooling.

## 1b. If you want BreezeFill on iPhone or iPad

You can install BreezeFill on `Safari` for iPhone and iPad, but not Chrome on iOS.

1. On a Mac, open this repo in Terminal.
2. Run:

```bash
bash scripts/package-safari.sh --ios-only
```

3. Open the generated Xcode project in `build/safari/BreezeFill`.
4. In Xcode, choose your Apple team under Signing.
5. Plug in your iPhone or pick an iPhone or iPad simulator.
6. Press `Run` in Xcode to install the app.
7. On the device, go to `Settings` → `Apps` → `Safari` → `Extensions`.
8. Turn on `BreezeFill`.
9. Open Safari and test it on a normal form.

Important:

- This is for `Safari` on iPhone and iPad.
- Chrome on iPhone does not support this extension install flow.
- It works on mobile web pages in Safari, not inside random native apps.
- If you want other people to install it, the clean path is `TestFlight` or the `App Store`.

## 2. If you are the owner and want a public launch site

The cleanest path is Vercel.

1. Push the repo to GitHub.
2. Go to [Vercel](https://vercel.com/).
3. Click `Add New...` → `Project`.
4. Import `ammarjmahmood/breezefill`.
5. Keep the repo root as the project root.
6. Do **not** add a build command.
7. Click `Deploy`.

Once Vercel finishes, you will get a live website.

Use that site as:

- your launch homepage
- your Product Hunt website link
- your Chrome Web Store support or official website link

## 3. Your Chrome Web Store privacy-policy URL

After Vercel deploys, your privacy page should be:

- `https://your-vercel-domain/privacy`

Use that exact URL in the Chrome Web Store privacy-policy field.

## 4. When the Chrome Web Store listing goes live

Open [docs/app.js](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/docs/app.js).

At the top, you will see:

```js
const config = {
  chromeStoreUrl: "",
```

Replace the empty string with your real Chrome Web Store URL.

Example:

```js
const config = {
  chromeStoreUrl: "https://chromewebstore.google.com/detail/your-extension-id",
```

Then:

1. Save the file.
2. Push the repo again.
3. Let Vercel redeploy.

After that, the launch site button will switch from:

- `Install from GitHub`

to:

- `Add to Chrome`

automatically.

## 5. If you want GitHub Pages instead of Vercel

Vercel is the better launch path now, but GitHub Pages can still work.

1. Open the GitHub repo.
2. Go to `Settings`.
3. Open `Pages`.
4. Under `Build and deployment`, choose `Deploy from a branch`.
5. Select branch `main`.
6. Select folder `/docs`.
7. Click `Save`.

Your site will be:

- `https://ammarjmahmood.github.io/breezefill/`

And your privacy URL will be:

- `https://ammarjmahmood.github.io/breezefill/privacy/`

## 6. Best files to open next

- [README.md](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/README.md)
- [LAUNCH.md](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/LAUNCH.md)
- [docs/app.js](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/docs/app.js)
- [store/chrome/upload-checklist.md](/Users/ammarmahmood/Documents/Codex/2026-04-28/okay-build-me-a-new-project/store/chrome/upload-checklist.md)
