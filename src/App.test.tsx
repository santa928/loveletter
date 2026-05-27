import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

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
