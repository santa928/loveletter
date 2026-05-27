import { useState } from "react";
import { selectPrivateView } from "../game/selectors";
import { startRound } from "../game/setup";
import { saveSession } from "../game/storage";
import type { GameState, SetupConfig } from "../game/types";

export interface GameSessionController {
  state: GameState | null;
  privateView: ReturnType<typeof selectPrivateView> | null;
  start(config: SetupConfig): void;
  openHandoff(): void;
}

/**
 * Owns the offline session and exposes secret projection only after opening.
 */
export function useGameSession(
  initialState?: GameState,
  random?: () => number,
): GameSessionController {
  const [state, setState] = useState<GameState | null>(initialState ?? null);

  /**
   * Persists every accepted session transition before rendering it.
   */
  const update = (next: GameState): void => {
    saveSession(next);
    setState(next);
  };

  /**
   * Deals a new round from the public setup selections.
   */
  const start = (config: SetupConfig): void => {
    update(startRound(config, random));
  };

  /**
   * Unlocks private information only for the player holding the device.
   */
  const openHandoff = (): void => {
    if (!state || state.phase !== "handoff") {
      throw new Error("開封できる手渡し状態ではありません");
    }

    update({ ...state, phase: "turn" });
  };

  return {
    state,
    privateView:
      state?.phase === "turn"
        ? selectPrivateView(state, state.activePlayerId)
        : null,
    start,
    openHandoff,
  };
}
