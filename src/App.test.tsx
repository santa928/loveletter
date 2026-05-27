import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("タイトル画面", () => {
  it("夜会のタイトルと開始操作を表示する", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Midnight Masquerade" }),
    ).toBeVisible();
    expect(screen.getByText("密書の夜会")).toBeVisible();
    expect(screen.getByRole("button", { name: "夜会へ入る" })).toBeVisible();
  });
});
