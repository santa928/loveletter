import { expect, test } from "@playwright/test";
import { applyRoundResult, settleRound } from "../src/game/scoring";
import { startRound } from "../src/game/setup";

const mobileViewports = [
  { width: 390, height: 844 },
  { width: 430, height: 932 },
] as const;

/**
 * Creates a completed public round while preserving a valid sixteen-card partition.
 */
function completedRound() {
  const state = startRound(
    { names: ["葵", "優斗"], matchMode: "single" },
    () => 0,
  );
  const exited = state.players[1];

  exited.discards.push(...exited.hand);
  exited.hand = [];
  exited.eliminated = true;

  return applyRoundResult(state, settleRound(state));
}

for (const viewport of mobileViewports) {
  test(`保存された公開結果を表示する (${viewport.width}x${viewport.height})`, async ({
    page,
  }) => {
    const consoleProblems: string[] = [];
    const savedState = completedRound();

    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        consoleProblems.push(message.text());
      }
    });
    await page.addInitScript((state) => {
      localStorage.setItem("midnight-masquerade.session", JSON.stringify(state));
    }, savedState);
    await page.setViewportSize(viewport);
    await page.goto(`/loveletter/?e2e=result-${viewport.width}`);

    await expect(page.getByRole("heading", { name: "ラウンドの結末" })).toBeVisible();
    await expect(page.getByText("葵の勝利")).toBeVisible();
    await expect(page.getByText("あなたの手札")).toHaveCount(0);
    const resultImage = page.locator(".result-screen img");
    await expect
      .poll(() =>
        resultImage.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true);
    const resultBounds = await page.evaluate(() => {
      const button = document.querySelector(".result-panel button");
      const bounds = button?.getBoundingClientRect();

      return {
        buttonBottomMargin: bounds ? window.innerHeight - bounds.bottom : -1,
        overflowsHorizontally:
          document.documentElement.scrollWidth > window.innerWidth,
        overflowsVertically:
          document.documentElement.scrollHeight > window.innerHeight,
      };
    });
    expect(resultBounds.buttonBottomMargin).toBeGreaterThanOrEqual(24);
    expect(resultBounds.overflowsHorizontally).toBe(false);
    expect(resultBounds.overflowsVertically).toBe(false);
    expect(consoleProblems).toEqual([]);

    await page.screenshot({
      fullPage: true,
      path: `test-results/result-screen-${viewport.width}x${viewport.height}.png`,
    });
  });
}
