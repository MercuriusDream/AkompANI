const { test, expect } = require("@playwright/test");

test("docs landing and first tutorial render", async ({ page }) => {
  await page.goto("/docs/");

  await expect(page.getByRole("heading", { name: "Documentation" })).toBeVisible();
  await page.getByRole("link", { name: "Start the 5-Minute Tutorial" }).click();

  await expect(page).toHaveURL(/\/docs\/view\.html\?doc=tutorials\/first-agent-5-minute\.md/);
  await expect(page.locator("#docContent h1")).toContainText("First Agent in 5 Minutes");
});
