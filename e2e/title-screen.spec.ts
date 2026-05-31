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
    await expect(page.getByRole("button", { name: "効果音をミュート" })).toBeVisible();

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
    const soundBounds = await page.evaluate(() => {
      const toggle = document.querySelector(".sound-toggle");
      const bounds = toggle?.getBoundingClientRect();

      return {
        rightMargin: bounds ? window.innerWidth - bounds.right : -1,
        topMargin: bounds?.top ?? -1,
      };
    });
    expect(soundBounds.rightMargin).toBeGreaterThanOrEqual(10);
    expect(soundBounds.topMargin).toBeGreaterThanOrEqual(10);
    await page.getByRole("button", { name: "遊び方を見る" }).click();
    await expect(page.getByRole("region", { name: "遊び方" })).toBeVisible();
    await expect(page.getByText("2〜4人で1台の端末を順に渡し")).toBeVisible();
    await expect(page.getByText("このゲームで使うカードのこと")).toBeVisible();
    const howToBounds = await page.evaluate(() => {
      const panel = document.querySelector(".home-guide");
      const bounds = panel?.getBoundingClientRect();

      return {
        leftMargin: bounds?.left ?? -1,
        rightMargin: bounds ? window.innerWidth - bounds.right : -1,
        overflowsHorizontally:
          document.documentElement.scrollWidth > window.innerWidth,
      };
    });
    expect(howToBounds.leftMargin).toBeGreaterThanOrEqual(14);
    expect(howToBounds.rightMargin).toBeGreaterThanOrEqual(14);
    expect(howToBounds.overflowsHorizontally).toBe(false);
    await page.getByRole("button", { name: "案内を閉じる" }).click();

    await page.getByRole("button", { name: "チュートリアル" }).click();
    await expect(page.getByRole("region", { name: "チュートリアル" })).toBeVisible();
    await expect(page.getByText("カードの効果説明を読み")).toBeVisible();
    await page.getByRole("button", { name: "カード一覧" }).click();
    await expect(page.getByRole("region", { name: "カード一覧" })).toBeVisible();
    await expect(page.getByText("門番")).toBeVisible();
    await expect(page.getByText("夜会の主")).toBeVisible();
    const catalogBounds = await page.evaluate(() => {
      const catalog = document.querySelector(".card-catalog");
      const bounds = catalog?.getBoundingClientRect();

      return {
        leftMargin: bounds?.left ?? -1,
        rightMargin: bounds ? window.innerWidth - bounds.right : -1,
        overflowsHorizontally:
          document.documentElement.scrollWidth > window.innerWidth,
      };
    });
    expect(catalogBounds.leftMargin).toBeGreaterThanOrEqual(14);
    expect(catalogBounds.rightMargin).toBeGreaterThanOrEqual(14);
    expect(catalogBounds.overflowsHorizontally).toBe(false);
    expect(consoleProblems).toEqual([]);
    await page.screenshot({
      fullPage: true,
      path: `test-results/title-with-sound-${viewport.width}x${viewport.height}.png`,
    });
  });
}
