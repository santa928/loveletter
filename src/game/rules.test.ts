import { describe, expect, it } from "vitest";
import { beginTurn, resolvePlay } from "./rules";
import { fixtureCard, ruleState } from "./test-fixtures";

describe("公式準拠の役職効果", () => {
  it("総支配人と位階5以上を同時に持つと引いた時点で退出する", () => {
    const next = beginTurn(
      ruleState({
        actorHand: [fixtureCard(7, "steward")],
        targetHand: [fixtureCard(2, "target")],
        deck: [fixtureCard(5, "drawn")],
      }),
    );

    expect(next.players[0].eliminated).toBe(true);
    expect(next.publicLog.at(-1)?.message).toContain("退出");
  });

  it("総支配人と位階4の合計11なら手番を続ける", () => {
    const next = beginTurn(
      ruleState({
        actorHand: [fixtureCard(7, "steward")],
        targetHand: [fixtureCard(2, "target")],
        deck: [fixtureCard(4, "drawn")],
      }),
    );

    expect(next.players[0].eliminated).toBe(false);
    expect(next.players[0].hand).toHaveLength(2);
  });

  it("門番は宣言した役職を持つ対象を退出させる", () => {
    const next = resolvePlay(
      ruleState({
        actorHand: [fixtureCard(2, "kept"), fixtureCard(1, "played")],
        targetHand: [fixtureCard(6, "target")],
      }),
      { cardId: "played", targetId: "p2", declaredRank: 6 },
    );

    expect(next.players[1].eliminated).toBe(true);
  });

  it("情報屋の確認結果は使用者向けの一時開示になる", () => {
    const next = resolvePlay(
      ruleState({
        actorHand: [fixtureCard(3, "kept"), fixtureCard(2, "played")],
        targetHand: [fixtureCard(8, "target-host")],
      }),
      { cardId: "played", targetId: "p2" },
    );

    expect(next.privateReveal).toEqual({
      viewerId: "p1",
      card: fixtureCard(8, "target-host"),
      reason: "informant",
    });
    expect(next.publicLog.at(-1)?.message).not.toContain("夜会の主");
  });

  it("決闘士は位階の低い対象を退出させる", () => {
    const next = resolvePlay(
      ruleState({
        actorHand: [fixtureCard(6, "kept"), fixtureCard(3, "played")],
        targetHand: [fixtureCard(1, "target")],
      }),
      { cardId: "played", targetId: "p2" },
    );

    expect(next.players[1].eliminated).toBe(true);
  });

  it("決闘士で位階が同じなら誰も退出しない", () => {
    const next = resolvePlay(
      ruleState({
        actorHand: [fixtureCard(6, "kept"), fixtureCard(3, "played")],
        targetHand: [fixtureCard(6, "target")],
      }),
      { cardId: "played", targetId: "p2" },
    );

    expect(next.players.every((player) => !player.eliminated)).toBe(true);
  });

  it("仮面の侍女で保護された対象は選べるが効果が無効になる", () => {
    const next = resolvePlay(
      ruleState({
        actorHand: [fixtureCard(3, "kept"), fixtureCard(2, "played")],
        targetHand: [fixtureCard(8, "target-host")],
        targetProtected: true,
      }),
      { cardId: "played", targetId: "p2" },
    );

    expect(next.privateReveal).toBeNull();
    expect(next.publicLog.at(-1)?.message).toContain("庇護");
    expect(next.publicLog.at(-1)?.message).not.toContain("夜会の主");
  });

  it("仮面の侍女は本人を次の手番まで保護する", () => {
    const next = resolvePlay(
      ruleState({
        actorHand: [fixtureCard(3, "kept"), fixtureCard(4, "played")],
        targetHand: [fixtureCard(8, "target-host")],
      }),
      { cardId: "played" },
    );

    expect(next.players[0].protected).toBe(true);
  });

  it("仮面の侍女の庇護は本人が次に引く前に解除される", () => {
    const state = ruleState({
      actorHand: [fixtureCard(3, "kept")],
      targetHand: [fixtureCard(8, "target-host")],
      deck: [fixtureCard(1, "drawn")],
    });
    state.players[0].protected = true;

    const next = beginTurn(state);

    expect(next.players[0].protected).toBe(false);
  });

  it("演出家の補充時に山札が空なら伏せ除外札を渡す", () => {
    const next = resolvePlay(
      ruleState({
        actorHand: [fixtureCard(2, "kept"), fixtureCard(5, "played")],
        targetHand: [fixtureCard(3, "target")],
      }),
      { cardId: "played", targetId: "p2" },
    );

    expect(next.players[1].hand[0].id).toBe("hidden-removed");
    expect(next.hiddenRemoved).toBeNull();
  });

  it("演出家は自分を対象にでき、山札があれば伏せ札より先に引く", () => {
    const next = resolvePlay(
      ruleState({
        actorHand: [fixtureCard(2, "kept"), fixtureCard(5, "played")],
        targetHand: [fixtureCard(3, "target")],
        deck: [fixtureCard(4, "replacement")],
      }),
      { cardId: "played", targetId: "p1" },
    );

    expect(next.players[0].hand[0].id).toBe("replacement");
    expect(next.hiddenRemoved?.id).toBe("hidden-removed");
  });

  it("演出家で夜会の主を手放した対象は退出する", () => {
    const next = resolvePlay(
      ruleState({
        actorHand: [fixtureCard(2, "kept"), fixtureCard(5, "played")],
        targetHand: [fixtureCard(8, "target-host")],
        deck: [fixtureCard(3, "replacement")],
      }),
      { cardId: "played", targetId: "p2" },
    );

    expect(next.players[1].eliminated).toBe(true);
  });

  it("交換商は対象と保持カードを入れ替える", () => {
    const next = resolvePlay(
      ruleState({
        actorHand: [fixtureCard(2, "actor-kept"), fixtureCard(6, "played")],
        targetHand: [fixtureCard(7, "target-kept")],
      }),
      { cardId: "played", targetId: "p2" },
    );

    expect(next.players[0].hand[0].id).toBe("target-kept");
    expect(next.players[1].hand[0].id).toBe("actor-kept");
  });

  it("夜会の主を使用した本人は直ちに退出する", () => {
    const next = resolvePlay(
      ruleState({
        actorHand: [fixtureCard(2, "kept"), fixtureCard(8, "played")],
        targetHand: [fixtureCard(3, "target")],
      }),
      { cardId: "played" },
    );

    expect(next.players[0].eliminated).toBe(true);
  });
});
