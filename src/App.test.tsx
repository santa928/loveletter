import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { startRound } from "./game/setup";
import { saveSession } from "./game/storage";
import { fixtureCard, ruleState } from "./game/test-fixtures";

beforeEach(() => {
  localStorage.clear();
});

describe("タイトル画面", () => {
  it("夜会のタイトルと開始操作を表示する", () => {
    render(<App random={() => 0} />);

    expect(
      screen.getByRole("heading", { name: "Midnight Masquerade" }),
    ).toBeVisible();
    expect(screen.getByText("密書の夜会")).toBeVisible();
    expect(screen.getByRole("button", { name: "夜会へ入る" })).toBeVisible();
  });
});

describe("一台受け渡しの開始フロー", () => {
  it("任意名を設定して手渡し画面から本人だけが手札を開く", () => {
    render(<App random={() => 0} />);

    fireEvent.click(screen.getByRole("button", { name: "夜会へ入る" }));
    expect(screen.getByRole("heading", { name: "夜会の支度" })).toBeVisible();

    fireEvent.change(screen.getByLabelText("プレイヤー1の名前"), {
      target: { value: "葵" },
    });
    fireEvent.click(screen.getByRole("button", { name: "夜会を始める" }));

    expect(screen.getByText("葵さんへ端末を渡してください")).toBeVisible();
    expect(screen.queryByText("あなたの手札")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "密書を開封する" }));

    expect(screen.getByRole("heading", { name: "葵さんの密書" })).toBeVisible();
    expect(screen.getByText("あなたの手札")).toBeVisible();
  });

  it("名前を省略した参加者は連番の案内名になる", () => {
    render(<App random={() => 0} />);

    fireEvent.click(screen.getByRole("button", { name: "夜会へ入る" }));
    fireEvent.click(screen.getByRole("button", { name: "夜会を始める" }));

    expect(
      screen.getByText("プレイヤー1さんへ端末を渡してください"),
    ).toBeVisible();
  });
});

describe("本人だけが進める手番解決フロー", () => {
  it("情報屋で確認した密書は閉じるまで次の招待客へ見せない", () => {
    const state = ruleState({
      actorHand: [fixtureCard(3, "kept")],
      targetHand: [fixtureCard(8, "target-host")],
      deck: [fixtureCard(2, "drawn-informant"), fixtureCard(4, "reserve")],
    });

    render(<App initialState={state} />);

    fireEvent.click(screen.getByRole("button", { name: "密書を一枚引く" }));
    fireEvent.click(screen.getByRole("button", { name: "情報屋を使用する" }));
    fireEvent.click(screen.getByRole("button", { name: "優斗を対象にする" }));

    expect(screen.getByRole("heading", { name: "情報屋の報せ" })).toBeVisible();
    expect(screen.getByText("夜会の主")).toBeVisible();
    expect(
      screen.queryByText("優斗さんへ端末を渡してください"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "確認して閉じる" }));

    expect(
      screen.getByText("優斗さんへ端末を渡してください"),
    ).toBeVisible();
    expect(screen.queryByText("夜会の主")).not.toBeInTheDocument();
  });

  it("演出家で本人が引き直した密書は確認してから受け渡す", () => {
    const state = ruleState({
      actorHand: [fixtureCard(2, "kept")],
      targetHand: [fixtureCard(3, "target")],
      deck: [
        fixtureCard(5, "drawn-director"),
        fixtureCard(4, "replacement"),
        fixtureCard(1, "reserve"),
      ],
    });

    render(<App initialState={state} />);

    fireEvent.click(screen.getByRole("button", { name: "密書を一枚引く" }));
    fireEvent.click(screen.getByRole("button", { name: "演出家を使用する" }));
    fireEvent.click(screen.getByRole("button", { name: "葵（本人）を対象にする" }));

    expect(screen.getByRole("heading", { name: "引き直した密書" })).toBeVisible();
    expect(screen.getByText("仮面の侍女")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "確認して閉じる" }));
    expect(
      screen.getByText("優斗さんへ端末を渡してください"),
    ).toBeVisible();
  });

  it("山札が尽きた手番の解決後は公開のラウンド結果へ進む", () => {
    const state = ruleState({
      actorHand: [fixtureCard(1, "kept")],
      targetHand: [fixtureCard(8, "target-host")],
      deck: [fixtureCard(4, "drawn-attendant")],
    });

    render(<App initialState={state} />);

    fireEvent.click(screen.getByRole("button", { name: "密書を一枚引く" }));
    fireEvent.click(
      screen.getByRole("button", { name: "仮面の侍女を使用する" }),
    );

    expect(screen.getByRole("heading", { name: "ラウンドの結末" })).toBeVisible();
    expect(screen.getByText("優斗の勝利")).toBeVisible();
    expect(screen.getByRole("button", { name: "新しい夜会を準備する" })).toBeVisible();
  });

  it("3点先取戦は得点を保持し勝者から次ラウンドへ進む", () => {
    const state = ruleState({
      actorHand: [fixtureCard(1, "kept")],
      targetHand: [fixtureCard(8, "target-host")],
      deck: [fixtureCard(4, "drawn-attendant")],
    });
    state.matchMode = "first-to-three";

    render(<App initialState={state} random={() => 0} />);

    fireEvent.click(screen.getByRole("button", { name: "密書を一枚引く" }));
    fireEvent.click(
      screen.getByRole("button", { name: "仮面の侍女を使用する" }),
    );

    expect(screen.getByRole("heading", { name: "ラウンドの結末" })).toBeVisible();
    expect(screen.getByText("2 点")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "次の密書を配る" }));

    expect(screen.getByText("優斗さんへ端末を渡してください")).toBeVisible();
  });

  it("3点到達時は該当者だけを最終勝者として表示する", () => {
    const state = ruleState({
      actorHand: [fixtureCard(5, "actor-kept")],
      targetHand: [fixtureCard(8, "target-host")],
      deck: [fixtureCard(4, "drawn-attendant")],
    });
    state.matchMode = "first-to-three";
    state.players[1].score = 1;

    render(<App initialState={state} />);

    fireEvent.click(screen.getByRole("button", { name: "密書を一枚引く" }));
    fireEvent.click(
      screen.getByRole("button", { name: "仮面の侍女を使用する" }),
    );

    expect(screen.getByRole("heading", { name: "夜会の結末" })).toBeVisible();
    expect(screen.getByText("優斗の勝利")).toBeVisible();
    expect(screen.getByRole("button", { name: "新しい夜会を準備する" })).toBeVisible();
  });
});

describe("保存された夜会の安全な再開", () => {
  it("本人手番を再表示すると受け渡しロックから再開する", () => {
    const state = startRound(
      { names: ["葵", "優斗"], matchMode: "single" },
      () => 0,
    );
    state.phase = "turn";
    saveSession(state);

    render(<App />);

    expect(screen.getByText("葵さんへ端末を渡してください")).toBeVisible();
    expect(screen.queryByText("あなたの手札")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "密書を開封する" }));
    expect(screen.getByText("あなたの手札")).toBeVisible();
  });

  it("一時開示中の再表示も本人の開封後だけ確認内容へ戻す", () => {
    const state = startRound(
      { names: ["葵", "優斗"], matchMode: "single" },
      () => 0,
    );
    const viewer = state.players.find(
      (player) => player.id === state.activePlayerId,
    );
    const target = state.players.find(
      (player) => player.id !== state.activePlayerId,
    );

    if (!viewer || !target || !target.hand[0]) {
      throw new Error("再開検証の招待客を作成できません");
    }

    state.phase = "private-reveal";
    state.privateReveal = {
      viewerId: viewer.id,
      card: target.hand[0],
      reason: "informant",
    };
    saveSession(state);

    render(<App />);

    expect(screen.getByText("葵さんへ端末を渡してください")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "情報屋の報せ" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "密書を開封する" }));
    expect(screen.getByRole("heading", { name: "情報屋の報せ" })).toBeVisible();
  });
});
