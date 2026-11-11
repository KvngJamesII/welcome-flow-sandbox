import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function fail(page: Page, scenario: string) {
  await page.evaluate(
    (value) => sessionStorage.setItem("sp_demo_failure", JSON.stringify(value)),
    scenario,
  );
}
async function fillSignup(page: Page) {
  await page.getByLabel("Username", { exact: true }).fill("new_punter");
  await page.getByLabel("Email address").fill("new@example.com");
  await page.getByLabel("Password", { exact: true }).fill("my-password");
}
async function reviewStarter(page: Page) {
  await page.getByRole("button", { name: "Let’s start", exact: true }).click();
  await page
    .getByRole("button", { name: "Use today’s games", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Use Play Safe", exact: true })
    .click();
}
async function fits(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
async function accessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
}

test("signup validates, keeps entered values, toggles password, and recovers from failure", async ({
  page,
}) => {
  await page.goto("/signup");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.locator("#username")).toBeFocused();
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(3);
  await fits(page);
  await accessible(page);
  await fillSignup(page);
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.locator("#password")).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(page.locator("#password")).toHaveAttribute("type", "password");
  await fail(page, "signup");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Creating your account" }),
  ).toBeDisabled();
  await expect(page.locator("#email")).toBeDisabled();
  await fits(page);
  await expect(page.getByRole("alert")).toContainText(
    "couldn’t create your account",
  );
  await expect(page.locator("#email")).toHaveValue("new@example.com");
  await accessible(page);
  await fail(page, "");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/generate\?starter=1/);
});

test("username availability ignores stale checks and tolerates a network error", async ({
  page,
}) => {
  await page.goto("/signup");
  await page.locator("#username").fill("taken");
  await expect(page.getByText("Checking availability…")).toBeVisible();
  await page.waitForTimeout(450); // Let the older slow response enter flight.
  await page.locator("#username").fill("available_name");
  await expect(page.getByText("Username available")).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByText("Username available")).toBeVisible();
  await page.locator("#username").fill("taken");
  await expect(
    page.getByText("That username is taken. Try another."),
  ).toBeVisible();
  await fail(page, "username");
  await page.locator("#username").fill("other_name");
  await expect(
    page.getByText("We’ll check availability when you create your account."),
  ).toBeVisible();
});

test("referral links prefill, remain editable, and carry into Google URL", async ({
  page,
}) => {
  await page.goto("/signup?ref=friend22&redirect=%2Fdashboard");
  await expect(page.locator("#referral")).toHaveValue("FRIEND22");
  await page.locator("#referral").fill("CHANGED");
  await fail(page, "google");
  const googleRequest = page.waitForRequest((request) =>
    request.url().includes("/api/auth/google?"),
  );
  await page.getByRole("button", { name: "Continue with Google" }).click();
  const url = new URL((await googleRequest).url());
  expect(url.searchParams.get("intent")).toBe("signup");
  expect(url.searchParams.get("next")).toBe("/dashboard");
  expect(url.searchParams.get("ref")).toBe("CHANGED");
  await expect(page.getByRole("alert")).toContainText(
    "Google sign-in didn’t finish",
  );
  await expect(page.locator("#referral")).toHaveValue("CHANGED");
  expect(new URL(page.url()).searchParams.get("redirect")).toBe("/dashboard");
  expect(new URL(page.url()).searchParams.has("auth_error")).toBe(false);
  await fail(page, "");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page).toHaveURL(/dashboard/);
});

test("external redirects are rejected", async ({ page }) => {
  await page.goto("/signup?redirect=%2F%2Fevil.example");
  await fillSignup(page);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL(/generate\?starter=1/);
});

test("booking loading, failure, retry, result, copy and refresh", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/generate?starter=1");
  await expect(
    page.getByRole("heading", { name: "Welcome. You’re in." }),
  ).toBeVisible();
  await fail(page, "booking");
  await reviewStarter(page);
  await page.getByRole("button", { name: "Create my code" }).click();
  await expect(
    page.getByRole("heading", { name: "Making your sample code…" }),
  ).toBeVisible();
  await fits(page);
  await expect(page.getByRole("alert")).toContainText(
    "Your credits are still here",
  );
  await fits(page);
  await accessible(page);
  await fail(page, "");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Here’s your sample code." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Copy sample code" }).click();
  await expect(
    page.getByRole("heading", { name: "Copied. You’re all set." }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "SAMPLE",
  );
  await page.getByText("See code details", { exact: true }).click();
  await expect(
    page.getByText("Sample home team vs sample away team"),
  ).toBeVisible();
  await fits(page);
  await accessible(page);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Here’s your sample code." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Done for now" }).click();
  await expect(
    page.getByRole("heading", { name: "Your code is saved." }),
  ).toBeVisible();
});

test("empty booking and clipboard denial have inline recovery", async ({
  page,
}) => {
  await page.goto("/generate");
  await fail(page, "empty");
  await reviewStarter(page);
  await page.getByRole("button", { name: "Create my code" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "No suitable games right now",
  );
  await fail(page, "");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Copy sample code" }),
  ).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("Denied")) },
      configurable: true,
    });
  });
  await page.getByRole("button", { name: "Copy sample code" }).click();
  await expect(
    page.getByText("Select and copy the sample code above."),
  ).toBeVisible();
});

test("onboarding can be deferred and resumed", async ({ page }) => {
  await page.goto("/generate?starter=1");
  await page.getByRole("link", { name: "I’ll do this later" }).click();
  await expect(
    page.getByRole("heading", { name: "Make yourself at home." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Get my first code" }).click();
  await expect(
    page.getByRole("button", { name: "Let’s start", exact: true }),
  ).toBeVisible();
});

test("login validates and recovers, respecting the return destination", async ({
  page,
}) => {
  await page.goto("/login?redirect=%2Fgenerate%3Fstarter%3D1");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.locator("#identifier")).toBeFocused();
  await page.locator("#identifier").fill("test@example.com");
  await page.locator("#password").fill("password");
  await fail(page, "login");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Logging in" })).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("couldn’t log you in");
  await fits(page);
  await accessible(page);
  await fail(page, "");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/generate\?starter=1/);
});

test("password reset covers validation, pending, failure and confirmation", async ({
  page,
}) => {
  await page.goto("/forgot-password");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.locator("#email")).toBeFocused();
  await page.locator("#email").fill("test@example.com");
  await fail(page, "reset");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(
    page.getByRole("button", { name: "Sending reset link" }),
  ).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("couldn’t send");
  await fail(page, "");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(
    page.getByRole("heading", { name: "Check your email." }),
  ).toBeVisible();
  await fits(page);
  await accessible(page);
});

for (const width of [320, 375, 390, 430, 768, 1440]) {
  test(`all screens fit at ${width}px and retain the brand font`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    for (const route of [
      "/signup",
      "/login",
      "/generate?starter=1",
      "/forgot-password",
      "/dashboard",
      "/terms",
      "/privacy",
      "/",
    ]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      await fits(page);
      expect(
        await page.evaluate(() =>
          [...document.fonts].some(
            (font) =>
              font.family.includes("Plus Jakarta Sans") &&
              font.status === "loaded",
          ),
        ),
      ).toBe(true);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
    if (width === 390) {
      await page.goto("/signup");
      await accessible(page);
    }
  });
}

test("keyboard focus, reduced motion and blocked storage remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/signup");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeVisible();
  expect(
    await page
      .locator(".auth-panel")
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
  await page.evaluate(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage denied");
      },
      configurable: true,
    });
  });
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page).toHaveURL(/generate\?starter=1/);
});

test("a booking resumes after refresh without spending credits twice", async ({
  page,
}) => {
  await page.goto("/generate");
  await reviewStarter(page);
  await page.getByRole("button", { name: "Create my code" }).click();
  await expect(
    page.getByRole("heading", { name: "Making your sample code…" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Making your sample code…" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Here’s your sample code." }),
  ).toBeVisible();
  await expect(
    page.getByText(/150 welcome credits were used/),
  ).not.toBeVisible();
  await page.getByText("See code details", { exact: true }).click();
  await expect(
    page.getByText(/150 welcome credits were used and 0 remain/),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Here’s your sample code." }),
  ).toBeVisible();
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
]) {
  test(`guided screens have one action and concealed details at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/generate?starter=1");
    const labels = [
      "Let’s start",
      "Use today’s games",
      "Use Play Safe",
      "Create my code",
    ];
    for (const label of labels) {
      await expect(page.locator(".guide .primary")).toHaveCount(1);
      await expect(page.locator(".guide-detail-body")).not.toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
      const primary = page.getByRole("button", { name: label, exact: true });
      await expect(primary).toBeInViewport();
      await fits(page);
      const copy = await page.locator(".guide-copy").evaluate((element) => ({
        height: element.getBoundingClientRect().height,
        line: parseFloat(getComputedStyle(element).lineHeight),
      }));
      expect(copy.height).toBeLessThanOrEqual(copy.line * 2 + 1);
      if (viewport.width === 390) await accessible(page);
      await page.locator(".guide-details summary").click();
      await expect(page.locator(".guide-detail-body")).toBeVisible();
      await fits(page);
      await primary.click();
    }
    await expect(page.locator('[data-screen="loading"]')).toBeVisible();
    await expect(page.locator('.guide-copy[role="status"]')).toBeVisible();
    await expect(page.locator(".guide .primary")).toHaveCount(0);
    await fits(page);
    await expect(
      page.getByRole("button", { name: "Copy sample code" }),
    ).toBeVisible();
    await expect(page.locator(".guide .primary")).toHaveCount(1);
    await expect(page.locator(".guide-detail-body")).not.toBeVisible();
    await expect(page.locator("main")).not.toContainText(/3\.24|1\.8|88%/);
    await page.getByText("See code details", { exact: true }).click();
    await expect(page.getByText("Sample picks", { exact: true })).toBeVisible();
    await expect(
      page.getByText(
        "Illustrations only, not predictions. No live odds or confidence scores.",
      ),
    ).toBeVisible();
    await fits(page);
  });
}

test("Back, browser Back, refresh and defer preserve the current question without opened details", async ({
  page,
}) => {
  await page.goto("/generate?starter=1");
  await page.getByRole("button", { name: "Let’s start", exact: true }).click();
  await page
    .getByRole("button", { name: "Use today’s games", exact: true })
    .click();
  await page.locator(".guide-details summary").click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Start with today’s games?" }),
  ).toBeVisible();
  await expect(page.locator(".guide-detail-body")).not.toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Welcome. You’re in." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Let’s start", exact: true }).click();
  await page
    .getByRole("button", { name: "Use today’s games", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Start with Play Safe?" }),
  ).toBeVisible();
  expect(new URL(page.url()).searchParams.get("starter")).toBe("1");
  await page.goto("/dashboard");
  await page.getByRole("link", { name: "Get my first code" }).click();
  await expect(
    page.getByRole("heading", { name: "Start with Play Safe?" }),
  ).toBeVisible();
});

test("legacy sample results cannot reintroduce invented metrics", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    sessionStorage.setItem(
      "sp_demo_booking",
      JSON.stringify({
        bookingCode: "DEMO150",
        cost: 150,
        credits: 0,
        totalOdds: 3.24,
        picks: [
          { match: "Invented match", selection: "88% confidence", odds: 1.8 },
        ],
      }),
    ),
  );
  await page.goto("/generate");
  await expect(page.getByText("SAMPLE", { exact: true })).toBeVisible();
  await page.getByText("See code details", { exact: true }).click();
  await expect(page.locator("main")).not.toContainText(
    /88%|3\.24|1\.8|Invented match|DEMO150/,
  );
});

test("details can be opened with the keyboard and reset with the next question", async ({
  page,
}) => {
  await page.goto("/generate");
  await page.locator(".guide-details summary").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".guide-detail-body")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator(".guide-detail-body")).not.toBeVisible();
  await page.getByRole("button", { name: "Let’s start", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Start with today’s games?" }),
  ).toBeFocused();
});

for (const failure of ["booking", "empty"]) {
  test(`${failure} recovery stays focused on a small phone`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/generate");
    await reviewStarter(page);
    await fail(page, failure);
    await page.getByRole("button", { name: "Create my code" }).click();
    await expect(page.locator('[data-screen="error"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Try again", exact: true }),
    ).toBeInViewport();
    await expect(page.locator(".guide .primary")).toHaveCount(1);
    await expect(page.locator(".guide-detail-body")).not.toBeVisible();
    await fits(page);
    await accessible(page);
  });
}
