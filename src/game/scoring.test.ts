import { describe, expect, it } from "vitest";
import { applyRoundResult, settleRound } from "./scoring";
import { fixtureCard, ruleState } from "./test-fixtures";

describe("ラウンド決着と連戦得点", () => {
  it("最後に残った招待客を勝者とする", () => {
    const state = ruleState({
      actorHand: [fixtureCard(2, "survivor")],
      targetHand: [],
    });
    state.players[1].eliminated = true;

    expect(settleRound(state).winners).toEqual(["p1"]);
    expect(settleRound(state).reason).toBe("last-standing");
  });

  it("山札が尽きて最大位階が同じなら双方へ1点を与える", () => {
    const state = ruleState({
      actorHand: [fixtureCard(5, "p1-card")],
      targetHand: [fixtureCard(5, "p2-card")],
      deck: [],
    });
    state.matchMode = "first-to-three";

    expect(settleRound(state).scoresAwarded).toEqual({ p1: 1, p2: 1 });
  });

  it("得点者の最終手札が夜会の主なら2点を与える", () => {
    const state = ruleState({
      actorHand: [fixtureCard(8, "host")],
      targetHand: [fixtureCard(6, "other")],
      deck: [],
    });
    state.matchMode = "first-to-three";

    expect(settleRound(state).scoresAwarded).toEqual({ p1: 2 });
  });

  it("直前の得点者を次ラウンドの開始者とし3点到達を検出する", () => {
    const state = ruleState({
      actorHand: [fixtureCard(2, "p1")],
      targetHand: [fixtureCard(7, "p2")],
      deck: [],
    });
    state.matchMode = "first-to-three";
    state.players[1].score = 2;

    const result = settleRound(state);

    expect(result.nextStarterId).toBe("p2");
    expect(result.matchWinnerIds).toEqual(["p2"]);
  });

  it("引き分け得点で複数人が同時に3点へ達した場合を保持する", () => {
    const state = ruleState({
      actorHand: [fixtureCard(5, "p1-card")],
      targetHand: [fixtureCard(5, "p2-card")],
      deck: [],
    });
    state.matchMode = "first-to-three";
    state.players[0].score = 2;
    state.players[1].score = 2;

    expect(settleRound(state).matchWinnerIds).toEqual(["p1", "p2"]);
  });

  it("得点と次開始者を状態へ適用し、3点到達時は最終結果に進む", () => {
    const state = ruleState({
      actorHand: [fixtureCard(2, "p1")],
      targetHand: [fixtureCard(8, "host")],
      deck: [],
    });
    state.matchMode = "first-to-three";
    state.players[1].score = 1;
    const result = settleRound(state);

    const next = applyRoundResult(state, result);

    expect(next.players[1].score).toBe(3);
    expect(next.activePlayerId).toBe("p2");
    expect(next.phase).toBe("match-result");
  });
});
