import { describe, expect, it } from "vitest";
import { startRound } from "./setup";
import { selectPrivateView, selectPublicView } from "./selectors";

describe("秘密保持の投影", () => {
  it("公開ビューには山札順序、伏せ札、各自の手札を含めない", () => {
    const state = startRound(
      { names: ["葵", "優斗", "凛"], matchMode: "single" },
      () => 0,
    );
    const publicView = selectPublicView(state);
    const serialized = JSON.stringify(publicView);

    if (!state.hiddenRemoved) {
      throw new Error("伏せ除外札が作成されていません");
    }
    expect(publicView.deckCount).toBe(state.deck.length);
    expect(publicView.faceUpRemoved).toEqual([]);
    expect(serialized).not.toContain(state.hiddenRemoved.id);
    expect(serialized).not.toContain(state.deck[0].id);
    for (const player of state.players) {
      expect(serialized).not.toContain(player.hand[0].id);
    }
  });

  it("本人の秘密ビューだけが手札と情報屋の確認結果を受け取る", () => {
    const state = startRound(
      { names: ["葵", "優斗"], matchMode: "single" },
      () => 0,
    );
    const viewerId = state.players[0].id;
    const otherId = state.players[1].id;
    const revealedCard = state.players[1].hand[0];
    const stateWithReveal = {
      ...state,
      privateReveal: {
        viewerId,
        card: revealedCard,
        reason: "informant" as const,
      },
    };

    expect(selectPrivateView(stateWithReveal, viewerId)).toEqual({
      hand: state.players[0].hand,
      revealedCard,
    });
    expect(selectPrivateView(stateWithReveal, otherId)).toEqual({
      hand: state.players[1].hand,
      revealedCard: null,
    });
  });
});
