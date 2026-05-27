import { describe, expect, it } from "vitest";
import { createDeck } from "./cards";
import { normalizeNames, startRound } from "./setup";

describe("ラウンド準備", () => {
  it("独自役職16枚を公式基本構成の位階枚数で作る", () => {
    const cards = createDeck();
    const rankCounts = cards.reduce<Record<number, number>>((counts, card) => {
      counts[card.rank] = (counts[card.rank] ?? 0) + 1;
      return counts;
    }, {});

    expect(cards).toHaveLength(16);
    expect(new Set(cards.map((card) => card.id)).size).toBe(16);
    expect(cards.some((card) => "count" in card)).toBe(false);
    expect(rankCounts).toEqual({
      1: 5,
      2: 2,
      3: 2,
      4: 2,
      5: 2,
      6: 1,
      7: 1,
      8: 1,
    });
    expect(cards.find((card) => card.rank === 7)?.name).toBe("総支配人");
    expect(cards.find((card) => card.rank === 8)?.name).toBe("夜会の主");
  });

  it("空欄名をプレイヤー番号で補完する", () => {
    expect(normalizeNames(["葵", "", "  "])).toEqual([
      "葵",
      "プレイヤー2",
      "プレイヤー3",
    ]);
  });

  it("2人未満または4人超の参加者では開始しない", () => {
    expect(() =>
      startRound({ names: ["葵"], matchMode: "single" }, () => 0),
    ).toThrow("参加人数は2人から4人");
    expect(() =>
      startRound(
        {
          names: ["葵", "優斗", "凛", "真琴", "紬"],
          matchMode: "single",
        },
        () => 0,
      ),
    ).toThrow("参加人数は2人から4人");
  });

  it("2人戦では伏せ札1枚と公開除外3枚を分けて配る", () => {
    const state = startRound(
      { names: ["葵", "優斗"], matchMode: "single" },
      () => 0,
    );

    expect(state.hiddenRemoved).not.toBeNull();
    expect(state.faceUpRemoved).toHaveLength(3);
    expect(state.players.every((player) => player.hand.length === 1)).toBe(
      true,
    );
    expect(state.deck).toHaveLength(10);
    if (!state.hiddenRemoved) {
      throw new Error("伏せ除外札が作成されていません");
    }
    const allCards = [
      state.hiddenRemoved,
      ...state.faceUpRemoved,
      ...state.players.flatMap((player) => player.hand),
      ...state.deck,
    ];
    expect(allCards).toHaveLength(16);
    expect(new Set(allCards.map((card) => card.id)).size).toBe(16);
  });

  it("3人ちょうどでは公開除外札を作らない", () => {
    const state = startRound(
      { names: ["葵", "優斗", "凛"], matchMode: "single" },
      () => 0,
    );

    expect(state.faceUpRemoved).toHaveLength(0);
    expect(state.deck).toHaveLength(12);
  });

  it("4人戦では公開除外札を作らず、開始者を生存者から選ぶ", () => {
    const state = startRound(
      { names: ["葵", "優斗", "凛", "真琴"], matchMode: "first-to-three" },
      () => 0,
    );

    expect(state.faceUpRemoved).toHaveLength(0);
    expect(state.deck).toHaveLength(11);
    expect(state.players.map((player) => player.id)).toContain(
      state.activePlayerId,
    );
  });

  it("抽選源が範囲外の値を返した場合は開始しない", () => {
    expect(() =>
      startRound({ names: ["葵", "優斗"], matchMode: "single" }, () => 1),
    ).toThrow("乱数は0以上1未満");
    expect(() =>
      startRound({ names: ["葵", "優斗"], matchMode: "single" }, () => NaN),
    ).toThrow("乱数は0以上1未満");
  });
});
