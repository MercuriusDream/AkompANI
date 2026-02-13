const { test, expect } = require("@playwright/test");

test("landing -> app chat -> deploy smoke path", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Get Started" })).toBeVisible();
  await page.getByRole("link", { name: "Get Started" }).click();

  await expect(page).toHaveURL(/\/app\/?\?mode=chat/);
  await expect(page.locator("#modeChatTab")).toHaveAttribute("aria-selected", "true");

  // Dismiss welcome guide overlay if visible (shown on first visit)
  const welcomeGuide = page.locator("#welcomeGuide");
  if (await welcomeGuide.isVisible()) {
    await page.locator("#welcomeGuideDismiss").click();
    await expect(welcomeGuide).toBeHidden();
  }

  await page.locator("#modeDeployTab").click();
  await expect(page.locator("#modeDeployTab")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#deployView")).toBeVisible();
});
