import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { chromium } from "@playwright/test";

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const extensionPath = projectRoot;
const baseUrl = process.env.BREEZEFILL_BASE_URL || "http://127.0.0.1:4173";
const outputDir = path.join(projectRoot, "docs", "assets", "demo");
const outputVideoPath = path.join(outputDir, "breezefill-demo.mp4");
const outputPosterPath = path.join(outputDir, "breezefill-demo-poster.png");

const demoProfile = {
  email: "builder@breezefill.dev",
  phone: "+1 555 014 2026",
  linkedin: "https://www.linkedin.com/in/breezefill-demo",
  portfolio: "https://breezefill.dev/portfolio",
  schoolName: "University of Toronto",
  degree: "Master's",
  graduationInfo: "May 2027"
};

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function hasRunningServer() {
  try {
    const response = await fetch(`${baseUrl}/demo-form.html`);
    return response.ok;
  } catch {
    return false;
  }
}

async function startServer() {
  if (await hasRunningServer()) {
    return null;
  }

  const serverProcess = spawn("node", ["scripts/test-server.mjs", "--port", "4173"], {
    cwd: projectRoot,
    stdio: ["ignore", "pipe", "pipe"]
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timed out while starting the BreezeFill test server."));
    }, 20_000);

    const onData = (chunk) => {
      const text = chunk.toString();
      if (text.includes("BreezeFill test server listening")) {
        clearTimeout(timeout);
        resolve();
      }
    };

    serverProcess.stdout.on("data", onData);
    serverProcess.stderr.on("data", onData);
    serverProcess.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Demo server exited early with code ${code ?? "unknown"}.`));
    });
  });

  return serverProcess;
}

async function launchExtensionContext() {
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "breezefill-demo-"));
  const captureDir = await fs.mkdtemp(path.join(os.tmpdir(), "breezefill-demo-captures-"));

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chromium",
    headless: true,
    ignoreDefaultArgs: ["--disable-extensions"],
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ],
    viewport: { width: 1280, height: 800 }
  });

  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    const bootstrapPage = await context.newPage();
    await bootstrapPage.goto(`${baseUrl}/demo-form.html`, { waitUntil: "domcontentloaded" });
    await wait(800);
    [serviceWorker] = context.serviceWorkers();

    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent("serviceworker");
    }

    await bootstrapPage.close();
  }

  return {
    context,
    extensionId: new URL(serviceWorker.url()).host,
    userDataDir,
    captureDir
  };
}

async function saveProfile(page, extensionId) {
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.locator("#profile-email").fill(demoProfile.email);
  await page.locator("#profile-phone").fill(demoProfile.phone);
  await page.locator("#profile-linkedin").fill(demoProfile.linkedin);
  await page.locator("#profile-portfolio").fill(demoProfile.portfolio);
  await page.locator("#tab-education").click();
  await page.locator("#profile-schoolName").fill(demoProfile.schoolName);
  await page.locator("#profile-degree").fill(demoProfile.degree);
  await page.locator("#profile-graduationInfo").fill(demoProfile.graduationInfo);
  await page.locator("#saveProfileButton").click();
  await page.locator("#statusBanner").waitFor({ state: "visible" });
  await wait(400);
}

async function addDemoCursor(page) {
  await page.addStyleTag({
    content: `
      #breezefill-demo-cursor {
        position: fixed;
        top: 0;
        left: 0;
        width: 24px;
        height: 24px;
        border-radius: 999px;
        border: 2px solid rgba(15, 125, 240, 0.92);
        background: rgba(15, 125, 240, 0.18);
        box-shadow: 0 10px 26px rgba(15, 125, 240, 0.2);
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 2147483647;
        transition:
          left 520ms cubic-bezier(0.2, 0.8, 0.2, 1),
          top 520ms cubic-bezier(0.2, 0.8, 0.2, 1),
          transform 180ms ease,
          box-shadow 180ms ease;
      }

      #breezefill-demo-cursor::after {
        content: "";
        position: absolute;
        inset: 5px;
        border-radius: 999px;
        background: rgba(15, 125, 240, 0.9);
      }

      #breezefill-demo-cursor.is-clicking {
        transform: translate(-50%, -50%) scale(0.84);
        box-shadow: 0 0 0 14px rgba(15, 125, 240, 0.12);
      }
    `
  });

  await page.evaluate(() => {
    const cursor = document.createElement("div");
    cursor.id = "breezefill-demo-cursor";
    cursor.style.left = "120px";
    cursor.style.top = "120px";
    document.body.appendChild(cursor);
  });
}

async function moveCursor(page, locator, pause = 700) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error("Unable to locate element for cursor animation.");
  }

  await page.evaluate(
    ({ x, y }) => {
      const cursor = document.getElementById("breezefill-demo-cursor");
      if (cursor) {
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
      }
    },
    {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2
    }
  );

  await wait(pause);
}

async function clickWithCursor(page, locator, pause = 300) {
  await moveCursor(page, locator);
  await page.evaluate(() => {
    const cursor = document.getElementById("breezefill-demo-cursor");
    cursor?.classList.add("is-clicking");
  });
  await locator.click();
  await wait(120);
  await page.evaluate(() => {
    const cursor = document.getElementById("breezefill-demo-cursor");
    cursor?.classList.remove("is-clicking");
  });
  await wait(pause);
}

async function captureStep(page, captureState, durationSeconds) {
  const filename = `frame-${String(captureState.index).padStart(2, "0")}.png`;
  const framePath = path.join(captureState.dir, filename);
  await page.screenshot({ path: framePath });
  captureState.frames.push({
    path: framePath,
    duration: durationSeconds
  });
  captureState.index += 1;
}

async function runDemo(page, captureState) {
  await page.goto(`${baseUrl}/demo-form.html`, { waitUntil: "networkidle" });
  await addDemoCursor(page);
  await wait(1200);
  await captureStep(page, captureState, 1.1);

  const emailField = page.locator('input[name="email"]');
  await clickWithCursor(page, emailField, 500);
  await captureStep(page, captureState, 1.1);
  await clickWithCursor(
    page,
    page.locator(".breezefill-suggestion").filter({ hasText: demoProfile.email }).first(),
    500
  );

  const phoneField = page.locator('input[name="phone"]');
  await clickWithCursor(page, phoneField, 500);
  await clickWithCursor(
    page,
    page.locator(".breezefill-suggestion").filter({ hasText: demoProfile.phone }).first(),
    450
  );

  const linkedinField = page.locator('input[name="linkedinProfile"]');
  await clickWithCursor(page, linkedinField, 500);
  await captureStep(page, captureState, 1.1);
  await clickWithCursor(
    page,
    page.locator(".breezefill-suggestion").filter({ hasText: demoProfile.linkedin }).first(),
    450
  );

  const schoolField = page.locator('input[name="schoolName"]');
  await clickWithCursor(page, schoolField, 500);
  await captureStep(page, captureState, 1.1);
  await clickWithCursor(
    page,
    page.locator(".breezefill-suggestion").filter({ hasText: demoProfile.schoolName }).first(),
    450
  );

  const degreeSelect = page.locator('select[name="degreeLevel"]');
  await clickWithCursor(page, degreeSelect, 500);
  await captureStep(page, captureState, 1.0);
  await clickWithCursor(
    page,
    page.locator(".breezefill-suggestion").filter({ hasText: demoProfile.degree }).first(),
    450
  );

  const githubField = page.locator('input[name="github"]');
  await clickWithCursor(page, githubField, 350);
  await githubField.pressSequentially("https://github.com/breezefill/demo-builder-hub", {
    delay: 52
  });
  await wait(500);
  await captureStep(page, captureState, 1.0);

  const submitButton = page.locator('button[type="submit"]');
  await clickWithCursor(page, submitButton, 600);

  const savePrompt = page.locator(".breezefill-prompt");
  await savePrompt.waitFor({ state: "visible" });
  await wait(350);
  await captureStep(page, captureState, 1.35);
  await clickWithCursor(page, savePrompt.locator('[data-action="save"]'), 700);

  const resetButton = page.locator('button[type="reset"]');
  await clickWithCursor(page, resetButton, 600);
  await clickWithCursor(page, githubField, 450);
  await captureStep(page, captureState, 1.2);
  await clickWithCursor(
    page,
    page
      .locator(".breezefill-suggestion")
      .filter({ hasText: "https://github.com/breezefill/demo-builder-hub" })
      .first(),
    900
  );
  await captureStep(page, captureState, 1.2);
}

async function writeConcatManifest(captureState) {
  const manifestPath = path.join(captureState.dir, "slides.txt");
  const lines = [];

  captureState.frames.forEach((frame, index) => {
    lines.push(`file '${frame.path.replace(/'/g, "'\\''")}'`);
    lines.push(`duration ${frame.duration.toFixed(2)}`);

    if (index === captureState.frames.length - 1) {
      lines.push(`file '${frame.path.replace(/'/g, "'\\''")}'`);
    }
  });

  await fs.writeFile(manifestPath, `${lines.join("\n")}\n`, "utf8");
  return manifestPath;
}

async function createAssets(captureState) {
  await fs.mkdir(outputDir, { recursive: true });
  const manifestPath = await writeConcatManifest(captureState);

  await execFileAsync("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    manifestPath,
    "-vf",
    "fps=30,scale=1280:-2:flags=lanczos,format=yuv420p",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "28",
    "-movflags",
    "+faststart",
    "-pix_fmt",
    "yuv420p",
    outputVideoPath
  ]);

  await execFileAsync("ffmpeg", [
    "-y",
    "-ss",
    "00:00:05.000",
    "-i",
    outputVideoPath,
    "-frames:v",
    "1",
    outputPosterPath
  ]);
}

async function main() {
  const serverProcess = await startServer();
  const launched = await launchExtensionContext();
  const captureState = {
    dir: launched.captureDir,
    frames: [],
    index: 1
  };

  try {
    const setupPage = await launched.context.newPage();
    await saveProfile(setupPage, launched.extensionId);
    await setupPage.close();

    const demoPage = await launched.context.newPage();
    await runDemo(demoPage, captureState);
    await demoPage.close();
  } finally {
    await launched.context.close();
    serverProcess?.kill("SIGTERM");
  }

  await createAssets(captureState);

  await fs.rm(launched.userDataDir, { recursive: true, force: true });
  await fs.rm(launched.captureDir, { recursive: true, force: true });

  console.log(`Demo video written to ${outputVideoPath}`);
  console.log(`Demo poster written to ${outputPosterPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
