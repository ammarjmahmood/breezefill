import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect, test as base } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const extensionPath = projectRoot;

async function launchExtensionContext() {
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "breezefill-playwright-"));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chromium",
    headless: process.env.BREEZEFILL_HEADLESS === "1",
    ignoreDefaultArgs: ["--disable-extensions"],
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ],
    viewport: { width: 1440, height: 960 }
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

async function openOptionsPage(context, extensionId) {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(page.locator("#profileForm")).toBeVisible();
  return page;
}

async function saveProfile(page, values) {
  const personalFields = [
    "fullName",
    "firstName",
    "lastName",
    "email",
    "phone",
    "company",
    "jobTitle",
    "address1",
    "address2",
    "city",
    "state",
    "zip",
    "country",
    "website",
    "portfolio",
    "linkedin",
    "github",
    "xProfile"
  ];
  const educationFields = ["schoolName", "degree", "programName", "graduationInfo"];

  for (const key of personalFields) {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      await page.locator(`#profile-${key}`).fill(values[key]);
    }
  }

  if (educationFields.some((key) => Object.prototype.hasOwnProperty.call(values, key))) {
    await page.locator("#tab-education").click();

    for (const key of educationFields) {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        await page.locator(`#profile-${key}`).fill(values[key]);
      }
    }
  }

  await page.locator("#saveProfileButton").click();
  await expect(page.locator("#statusBanner")).toContainText("Profile saved.");
}

async function openFormPage(context, relativePath) {
  const page = await context.newPage();
  await page.goto(relativePath);
  await expect(page.locator(".breezefill-suggestions")).toHaveCount(1);
  return page;
}

const test = base.extend({
  extension: async ({}, use) => {
    const launched = await launchExtensionContext();

    try {
      await use(launched);
    } finally {
      await launched.context.close();
      await fs.rm(launched.userDataDir, { recursive: true, force: true });
    }
  }
});

test("suggests profile values on classic, select, and shadow fields", async ({ extension, baseURL }) => {
  const optionsPage = await openOptionsPage(extension.context, extension.extensionId);
  await saveProfile(optionsPage, {
    fullName: "Ammar Mahmood",
    email: "ammar@example.com",
    phone: "+1 555 555 5555",
    degree: "Master's",
    linkedin: "https://www.linkedin.com/in/ammar",
    schoolName: "University of Toronto",
    graduationInfo: "May 2027"
  });

  const page = await openFormPage(extension.context, `${baseURL}/test-form.html`);

  const emailField = page.locator('input[name="email"]');
  await emailField.click();
  const emailSuggestion = page.locator(".breezefill-suggestion").filter({
    hasText: "ammar@example.com"
  });
  await expect(emailSuggestion).toBeVisible();
  await emailSuggestion.click();
  await expect(emailField).toHaveValue("ammar@example.com");

  const degreeSelect = page.locator('select[name="degreeLevel"]');
  await degreeSelect.click();
  const degreeSuggestion = page.locator(".breezefill-suggestion").filter({
    hasText: "Master's"
  });
  await expect(degreeSuggestion).toBeVisible();
  await degreeSuggestion.click();
  await expect(degreeSelect).toHaveValue("Master's");

  const shadowEmailField = page.locator("shadow-form-demo").locator('input[name="shadowEmail"]');
  await shadowEmailField.click();
  const shadowSuggestion = page.locator(".breezefill-suggestion").filter({
    hasText: "ammar@example.com"
  });
  await expect(shadowSuggestion).toBeVisible();
  await shadowSuggestion.click();
  await expect(shadowEmailField).toHaveValue("ammar@example.com");
});

test("captures and re-suggests saved form responses after submit", async ({ extension, baseURL }) => {
  const optionsPage = await openOptionsPage(extension.context, extension.extensionId);
  await saveProfile(optionsPage, {
    fullName: "Ammar Mahmood",
    email: "ammar@example.com",
    phone: "+1 555 555 5555"
  });

  const page = await openFormPage(extension.context, `${baseURL}/test-form.html`);
  const githubField = page.locator('input[name="github"]');

  await githubField.fill("https://github.com/breezefill-test");
  await page.locator('button[type="submit"]').click();

  const prompt = page.locator(".breezefill-prompt");
  await expect(prompt).toContainText("Save your github");
  await prompt.locator('[data-action="save"]').click();
  await expect(page.locator(".breezefill-toast")).toContainText("Saved for next time.");

  await page.locator('button[type="reset"]').click();
  await githubField.click();

  const savedSuggestion = page.locator(".breezefill-suggestion").filter({
    hasText: "https://github.com/breezefill-test"
  });
  await expect(savedSuggestion).toBeVisible();
  await savedSuggestion.click();
  await expect(githubField).toHaveValue("https://github.com/breezefill-test");
});

test("matches ATS-style application fields when a job adapter is active", async ({ extension, baseURL }) => {
  const optionsPage = await openOptionsPage(extension.context, extension.extensionId);
  await saveProfile(optionsPage, {
    email: "ammar@example.com",
    phone: "+1 555 555 5555",
    linkedin: "https://www.linkedin.com/in/ammar",
    schoolName: "University of Toronto",
    degree: "Master's",
    graduationInfo: "May 2027"
  });

  const page = await openFormPage(extension.context, `${baseURL}/test-form.html?ashby_jid=demo`);

  const linkedinField = page.locator('input[name="candidate.linkedinUrl"]');
  await linkedinField.click();
  const linkedinSuggestion = page.locator(".breezefill-suggestion").filter({
    hasText: "https://www.linkedin.com/in/ammar"
  });
  await expect(linkedinSuggestion).toBeVisible();
  await linkedinSuggestion.click();
  await expect(linkedinField).toHaveValue("https://www.linkedin.com/in/ammar");

  const schoolField = page.locator('input[name="education.schoolName"]');
  await schoolField.click();
  const schoolSuggestion = page.locator(".breezefill-suggestion").filter({
    hasText: "University of Toronto"
  });
  await expect(schoolSuggestion).toBeVisible();

  const atsDegreeSelect = page.locator('select[name="education.degreeLevel"]');
  await atsDegreeSelect.click();
  const atsDegreeSuggestion = page.locator(".breezefill-suggestion").filter({
    hasText: "Master's"
  });
  await expect(atsDegreeSuggestion).toBeVisible();
  await atsDegreeSuggestion.click();
  await expect(atsDegreeSelect).toHaveValue("Master's");
});
