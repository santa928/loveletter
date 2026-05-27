import { expect, test } from "@playwright/test";

test("GitHub Pages の公開パスで招待画面を表示する", async ({ page }) => {
  await page.goto("/loveletter/?e2e=pages-title");

  await expect(
    page.getByRole("heading", { name: "Midnight Masquerade" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "夜会へ入る" })).toBeVisible();
});
