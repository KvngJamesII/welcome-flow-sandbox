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
  await expect(page.getByText("2–5 total odds")).toBeVisible();
  await fail(page, "booking");
  await page.getByRole("button", { name: "Create my first code" }).click();
  await expect(
    page.getByRole("heading", { name: "Creating your code." }),
  ).toBeVisible();
  await fits(page);
  await expect(page.getByRole("alert")).toContainText(
    "150 credits haven’t been used",
  );
  await fits(page);
  await accessible(page);
  await fail(page, "");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your first code is ready." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Copy booking code" }).click();
  await expect(page.getByRole("button", { name: "Code copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "DEMO150",
  );
  await page.getByRole("button", { name: "View sample selections" }).click();
  await expect(page.getByText("Home team A vs Away team A")).toBeVisible();
  await fits(page);
  await accessible(page);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your first code is ready." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Go to dashboard" }).click();
  await expect(
    page.getByRole("heading", { name: "Your code is saved." }),
  ).toBeVisible();
});

test("empty booking and clipboard denial have inline recovery", async ({
  page,
}) => {
  await page.goto("/generate");
  await fail(page, "empty");
  await page.getByRole("button", { name: "Create my first code" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "aren’t enough suitable games",
  );
  await fail(page, "");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Copy booking code" }),
  ).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("Denied")) },
      configurable: true,
    });
  });
  await page.getByRole("button", { name: "Copy booking code" }).click();
  await expect(
    page.getByText(
      "Copy isn’t available in this browser. Select and copy the code above.",
    ),
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
    page.getByRole("button", { name: "Create my first code" }),
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
  await page.getByRole("button", { name: "Create my first code" }).click();
  await expect(
    page.getByRole("heading", { name: "Creating your code." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Creating your code." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your first code is ready." }),
  ).toBeVisible();
  await expect(
    page.getByText("150 welcome credits used · 0 credits remaining"),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your first code is ready." }),
  ).toBeVisible();
});
