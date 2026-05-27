import { expect, test } from "@playwright/test";

const mobileViewports = [
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const;

for (const viewport of mobileViewports) {
  test(`GitHub Pages の公開パスで招待画面を表示する (${viewport.width}x${viewport.height})`, async ({
    page,
  }) => {
    const consoleProblems: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        consoleProblems.push(message.text());
      }
    });

    await page.setViewportSize(viewport);
    await page.goto(`/loveletter/?e2e=pages-title-${viewport.width}`);

    await expect(
      page.getByRole("heading", { name: "Midnight Masquerade" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "夜会へ入る" })).toBeVisible();

    const backdrop = page.locator(".title-screen__backdrop");
    await expect(backdrop).toBeVisible();
    await expect
      .poll(() =>
        backdrop.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true);

    expect(
      await page.evaluate(() => ({
        horizontal: document.documentElement.scrollWidth > window.innerWidth,
        vertical: document.documentElement.scrollHeight > window.innerHeight,
      })),
    ).toEqual({ horizontal: false, vertical: false });
    expect(consoleProblems).toEqual([]);
  });
}
