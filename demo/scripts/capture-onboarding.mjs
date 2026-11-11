// Run with the demo server running: CHROMIUM_PATH=/usr/bin/chromium node scripts/capture-onboarding.mjs
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
const output = fileURLToPath(
  new URL("../../docs/screenshots/", import.meta.url),
);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const options = {
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
};
const context = await browser.newContext(options);
await context.grantPermissions(["clipboard-read", "clipboard-write"]);
const page = await context.newPage();
const base = process.env.DEMO_URL || "http://127.0.0.1:5173";
const capture = async (target, name) => {
  await target.evaluate(() => document.fonts.ready);
  await target.screenshot({ path: `${output}${name}.png`, fullPage: true });
};
const advance = async (target) => {
  for (const name of [
    "Let’s start",
    "Use today’s games",
    "Use Play Safe",
    "Create my code",
  ])
    await target.getByRole("button", { name, exact: true }).click();
};
try {
  await page.goto(`${base}/generate?starter=1`);
  const screens = [
    ["onboarding", "Let’s start"],
    ["onboarding-today", "Use today’s games"],
    ["onboarding-approach", "Use Play Safe"],
    ["onboarding-odds", "Create my code"],
  ];
  for (const [name, button] of screens) {
    await capture(page, name);
    if (name === "onboarding") {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await capture(page, "onboarding-desktop");
      await page.setViewportSize(options.viewport);
    }
    if (name === "onboarding-odds") {
      await page.locator("summary").click();
      await capture(page, "onboarding-details");
      await page.locator("summary").click();
    }
    await page.getByRole("button", { name: button, exact: true }).click();
  }
  await capture(page, "booking-loading");
  await page
    .getByRole("button", { name: "Copy sample code", exact: true })
    .waitFor();
  await capture(page, "booking-result");
  await page.locator("summary").click();
  await capture(page, "booking-details");
  await page.locator("summary").click();
  await page
    .getByRole("button", { name: "Copy sample code", exact: true })
    .click();
  await capture(page, "booking-copied");
  for (const failure of ["booking", "empty"]) {
    const failurePage = await context.newPage();
    await failurePage.setViewportSize({ width: 320, height: 568 });
    await failurePage.goto(`${base}/generate`);
    await failurePage.evaluate(
      (value) =>
        sessionStorage.setItem("sp_demo_failure", JSON.stringify(value)),
      failure,
    );
    await advance(failurePage);
    await failurePage.locator('[data-screen="error"]').waitFor();
    await capture(
      failurePage,
      failure === "booking" ? "booking-error" : "booking-unavailable",
    );
    await failurePage.close();
  }
} finally {
  await browser.close();
}
