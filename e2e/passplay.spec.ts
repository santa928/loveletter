import { expect, test } from "@playwright/test";

const mobileViewports = [
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const;

for (const viewport of mobileViewports) {
  test(`手渡しロックから本人だけが密書を開く (${viewport.width}x${viewport.height})`, async ({
    page,
  }) => {
    const consoleProblems: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        consoleProblems.push(message.text());
      }
    });

    await page.setViewportSize(viewport);
    await page.goto(`/loveletter/?e2e=passplay-${viewport.width}`);
    await page.getByRole("button", { name: "夜会へ入る" }).click();

    await expect(page.getByRole("heading", { name: "夜会の支度" })).toBeVisible();
    await page.getByRole("button", { name: "夜会を始める" }).click();

    await expect(page.getByRole("region", { name: "端末の受け渡し" })).toBeVisible();
    await expect(page.getByText("あなたの手札")).toHaveCount(0);
    const handoffBounds = await page.evaluate(() => {
        const button = document.querySelector(".handoff-panel button");
        const bounds = button?.getBoundingClientRect();
        return {
          bottomMargin: bounds ? window.innerHeight - bounds.bottom : -1,
          overflowsHorizontally:
            document.documentElement.scrollWidth > window.innerWidth,
          overflowsVertically:
            document.documentElement.scrollHeight > window.innerHeight,
        };
      });
    expect(handoffBounds.bottomMargin).toBeGreaterThanOrEqual(24);
    expect(handoffBounds.overflowsHorizontally).toBe(false);
    expect(handoffBounds.overflowsVertically).toBe(false);

    await page.getByRole("button", { name: "密書を開封する" }).click();

    await expect(page.getByText("あなたの手札")).toBeVisible();
    const roleImage = page.locator(".role-card img");
    await expect(roleImage).toBeVisible();
    expect(
      await roleImage.evaluate(
        (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
      ),
    ).toBe(true);
    const cardBounds = await page.evaluate(() => {
        const bounds = document.querySelector(".role-card")?.getBoundingClientRect();
        return {
          leftMargin: bounds?.left ?? -1,
          rightMargin: bounds ? window.innerWidth - bounds.right : -1,
          overflowsHorizontally:
            document.documentElement.scrollWidth > window.innerWidth,
        };
      });
    expect(cardBounds.leftMargin).toBeGreaterThanOrEqual(20);
    expect(cardBounds.rightMargin).toBeGreaterThanOrEqual(20);
    expect(cardBounds.overflowsHorizontally).toBe(false);
    expect(consoleProblems).toEqual([]);
  });
}
