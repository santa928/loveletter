import { beforeEach, describe, expect, it } from "vitest";
import { startRound } from "./setup";
import { loadSession, saveSession } from "./storage";

describe("端末内セッション保存", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("正しいゲーム状態を保存して復元する", () => {
    const state = startRound(
      { names: ["葵", "優斗"], matchMode: "single" },
      () => 0,
    );

    saveSession(state);

    expect(loadSession()).toEqual(state);
  });

  it("カードが欠落した保存値を破棄する", () => {
    const state = startRound(
      { names: ["葵", "優斗"], matchMode: "single" },
      () => 0,
    );
    state.deck.pop();
    localStorage.setItem(
      "midnight-masquerade.session",
      JSON.stringify(state),
    );

    expect(loadSession()).toBeNull();
  });

  it("結果フェーズなのに公開結果が欠落した保存値を破棄する", () => {
    const state = startRound(
      { names: ["葵", "優斗"], matchMode: "single" },
      () => 0,
    );
    state.phase = "round-result";
    localStorage.setItem(
      "midnight-masquerade.session",
      JSON.stringify(state),
    );

    expect(loadSession()).toBeNull();
  });

  it("復元不可能な保存値を破棄してnullを返す", () => {
    localStorage.setItem(
      "midnight-masquerade.session",
      '{"phase":"broken","players":[]}',
    );

    expect(loadSession()).toBeNull();
    expect(localStorage.getItem("midnight-masquerade.session")).toBeNull();
  });
});
