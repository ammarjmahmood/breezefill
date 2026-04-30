import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const extensionPath = projectRoot;
const storeRoot = path.join(projectRoot, "store", "chrome");
const screenshotsDir = path.join(storeRoot, "screenshots");
const promoDir = path.join(storeRoot, "promo");
const baseURL = process.env.BREEZEFILL_BASE_URL || "http://127.0.0.1:4173";

async function isServerReachable() {
  try {
    const response = await fetch(`${baseURL}/test-form.html`);
    return response.ok;
  } catch (_error) {
    return false;
  }
}

async function waitForServer(timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await isServerReachable()) {
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 250);
    });
  }

  throw new Error(`Timed out waiting for test server at ${baseURL}`);
}

async function ensureLocalServer() {
  if (await isServerReachable()) {
    return null;
  }

  const serverProcess = spawn(
    process.execPath,
    [path.join(projectRoot, "scripts", "test-server.mjs"), "--port", "4173"],
    {
      cwd: projectRoot,
      stdio: "inherit"
    }
  );

  await waitForServer(15_000);
  return serverProcess;
}

async function launchExtensionContext() {
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "breezefill-store-assets-"));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chromium",
    headless: process.env.BREEZEFILL_HEADLESS === "1",
    ignoreDefaultArgs: ["--disable-extensions"],
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ],
    viewport: { width: 1280, height: 800 }
  });

  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent("serviceworker");
  }

  return {
    context,
    extensionId: new URL(serviceWorker.url()).host,
    userDataDir
  };
}

async function saveProfile(page) {
  const values = {
    fullName: "Ammar Mahmood",
    email: "ammar@example.com",
    phone: "+1 555 555 5555",
    linkedin: "https://www.linkedin.com/in/ammar",
    github: "https://github.com/ammar",
    portfolio: "https://ammar.design",
    schoolName: "University of Toronto",
    degree: "Master's",
    programName: "Computer Science",
    graduationInfo: "May 2027"
  };

  for (const [key, value] of Object.entries(values)) {
    if (["schoolName", "degree", "programName", "graduationInfo"].includes(key)) {
      continue;
    }

    await page.locator(`#profile-${key}`).fill(value);
  }

  await page.locator("#tab-education").click();

  for (const key of ["schoolName", "degree", "programName", "graduationInfo"]) {
    await page.locator(`#profile-${key}`).fill(values[key]);
  }

  await page.locator("#saveProfileButton").click();
  await page.locator("#statusBanner").waitFor({ state: "visible" });
}

async function captureOptions(page, extensionId) {
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.locator("#profileForm").waitFor({ state: "visible" });
  await saveProfile(page);
  await page.locator("#tab-personal").click();
  await page.screenshot({
    path: path.join(screenshotsDir, "01-options-overview-1280x800.png")
  });
}

async function captureAutofill(page) {
  await page.goto(`${baseURL}/test-form.html`);
  await page.locator(".breezefill-suggestions").waitFor({ state: "attached" });
  await page.locator('input[name="email"]').click();
  await page
    .locator(".breezefill-suggestion")
    .filter({ hasText: "ammar@example.com" })
    .waitFor({ state: "visible" });
  await page.screenshot({
    path: path.join(screenshotsDir, "02-autofill-suggestion-1280x800.png")
  });
}

async function captureSavePrompt(page) {
  await page.goto(`${baseURL}/test-form.html`);
  await page.locator(".breezefill-suggestions").waitFor({ state: "attached" });
  await page.locator('input[name="github"]').fill("https://github.com/breezefill-test");
  await page.locator('button[type="submit"]').click();
  await page.locator(".breezefill-prompt").waitFor({ state: "visible" });
  await page.screenshot({
    path: path.join(screenshotsDir, "03-save-prompt-1280x800.png")
  });
}

async function captureApplication(page) {
  await page.goto(`${baseURL}/test-form.html?ashby_jid=demo`);
  await page.locator(".breezefill-suggestions").waitFor({ state: "attached" });
  await page.locator('input[name="candidate.linkedinUrl"]').click();
  await page
    .locator(".breezefill-suggestion")
    .filter({ hasText: "https://www.linkedin.com/in/ammar" })
    .waitFor({ state: "visible" });
  await page.screenshot({
    path: path.join(screenshotsDir, "04-application-fields-1280x800.png")
  });
}

async function capturePromoTile(page) {
  const logoMarkSvg = await fs.readFile(path.join(projectRoot, "assets", "logo-mark.svg"), "utf8");
  const logoMarkDataUrl = `data:image/svg+xml;base64,${Buffer.from(logoMarkSvg).toString("base64")}`;

  await page.setViewportSize({ width: 440, height: 280 });
  await page.setContent(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <style>
          :root {
            color-scheme: light;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            width: 440px;
            height: 280px;
            font-family: "SF Pro Display", "Avenir Next", "Segoe UI", sans-serif;
            background:
              radial-gradient(circle at top left, rgba(166, 225, 255, 0.92), transparent 36%),
              linear-gradient(135deg, #f6fbff 0%, #e2f2ff 48%, #eef8ff 100%);
            overflow: hidden;
          }

          .card {
            position: relative;
            width: 100%;
            height: 100%;
            padding: 28px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border: 1px solid rgba(16, 35, 61, 0.08);
          }

          .orb {
            position: absolute;
            border-radius: 999px;
            filter: blur(8px);
            opacity: 0.72;
          }

          .orb--one {
            width: 132px;
            height: 132px;
            right: -18px;
            top: -26px;
            background: rgba(22, 119, 255, 0.18);
          }

          .orb--two {
            width: 150px;
            height: 150px;
            left: -32px;
            bottom: -56px;
            background: rgba(85, 203, 255, 0.2);
          }

          .brand {
            display: flex;
            gap: 14px;
            align-items: center;
            position: relative;
            z-index: 1;
          }

          .mark {
            width: 52px;
            height: 52px;
          }

          .eyebrow {
            margin: 0 0 6px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: #4e708f;
          }

          h1 {
            margin: 0;
            font-size: 32px;
            line-height: 0.95;
            letter-spacing: -0.06em;
            color: #10233d;
          }

          p {
            margin: 0;
            font-size: 15px;
            line-height: 1.45;
            color: #35506a;
            max-width: 270px;
            position: relative;
            z-index: 1;
          }

          .pill {
            align-self: flex-start;
            padding: 10px 14px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.88);
            box-shadow: 0 14px 24px rgba(16, 35, 61, 0.08);
            font-size: 13px;
            font-weight: 700;
            color: #183756;
            position: relative;
            z-index: 1;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="orb orb--one"></div>
          <div class="orb orb--two"></div>

          <div class="brand">
            <img class="mark" src="${logoMarkDataUrl}" alt="">
            <div>
              <p class="eyebrow">Smart Browser Autofill</p>
              <h1>BreezeFill</h1>
            </div>
          </div>

          <p>Natural autofill for forms. Suggest your saved details and learn new responses only when you say yes.</p>

          <div class="pill">Quiet suggestions. Local storage. Clean save prompts.</div>
        </div>
      </body>
    </html>
  `);
  await page.screenshot({
    path: path.join(promoDir, "breezefill-small-promo-440x280.png")
  });
}

async function main() {
  await fs.mkdir(screenshotsDir, { recursive: true });
  await fs.mkdir(promoDir, { recursive: true });

  const serverProcess = await ensureLocalServer();
  const launched = await launchExtensionContext();

  try {
    const optionsPage = await launched.context.newPage();
    await captureOptions(optionsPage, launched.extensionId);
    await optionsPage.close();

    const autofillPage = await launched.context.newPage();
    await captureAutofill(autofillPage);
    await autofillPage.close();

    const promptPage = await launched.context.newPage();
    await captureSavePrompt(promptPage);
    await promptPage.close();

    const applicationPage = await launched.context.newPage();
    await captureApplication(applicationPage);
    await applicationPage.close();

    const promoPage = await launched.context.newPage();
    await capturePromoTile(promoPage);
    await promoPage.close();
  } finally {
    await launched.context.close();
    await fs.rm(launched.userDataDir, { recursive: true, force: true });

    if (serverProcess) {
      serverProcess.kill("SIGTERM");
    }
  }

  console.log(`Store assets generated in ${storeRoot}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
