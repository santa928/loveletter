import { useState } from "react";
import { beginTurn, resolvePlay, type PlayChoice } from "../game/rules";
import { applyRoundResult, settleRound } from "../game/scoring";
import {
  selectPrivateView,
  selectPublicView,
  selectResultView,
} from "../game/selectors";
import { startRound } from "../game/setup";
import { clearSession, loadSession, saveSession } from "../game/storage";
import type { GameState, SetupConfig } from "../game/types";

export interface GameSessionController {
  state: GameState | null;
  publicView: ReturnType<typeof selectPublicView> | null;
  privateView: ReturnType<typeof selectPrivateView> | null;
  resultView: ReturnType<typeof selectResultView> | null;
  start(config: SetupConfig): void;
  openHandoff(): void;
  drawCard(): void;
  playCard(choice: PlayChoice): void;
  closePrivateReveal(): void;
  continueMatch(): void;
  reset(): void;
}

/**
 * Selects the next surviving invitee after the current actor in seating order.
 */
function nextSurvivorId(state: GameState): string {
  const actorIndex = state.players.findIndex(
    (player) => player.id === state.activePlayerId,
  );

  for (let offset = 1; offset <= state.players.length; offset += 1) {
    const candidate = state.players[(actorIndex + offset) % state.players.length];

    if (!candidate.eliminated) {
      return candidate.id;
    }
  }

  throw new Error("次の招待客が見つかりません");
}

/**
 * Restores a persisted private view only behind a fresh device-handoff lock.
 */
function loadLockedSession(): GameState | null {
  const saved = loadSession();

  if (!saved) {
    return null;
  }

  if (saved.phase === "turn" || saved.phase === "private-reveal") {
    return { ...saved, phase: "handoff" };
  }

  return saved;
}

/**
 * Owns the offline session and exposes secret projection only after opening.
 */
export function useGameSession(
  initialState?: GameState,
  random?: () => number,
): GameSessionController {
  const [state, setState] = useState<GameState | null>(() =>
    initialState ?? loadLockedSession(),
  );

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

    update({
      ...state,
      phase: state.privateReveal ? "private-reveal" : "turn",
    });
  };

  /**
   * Ends a played turn at either a public result or the next locked handoff.
   */
  const completeTurn = (resolved: GameState): void => {
    const survivorCount = resolved.players.filter(
      (player) => !player.eliminated,
    ).length;

    if (survivorCount <= 1 || resolved.deck.length === 0) {
      update(applyRoundResult(resolved, settleRound(resolved)));
      return;
    }

    update({
      ...resolved,
      activePlayerId: nextSurvivorId(resolved),
      phase: "handoff",
      privateReveal: null,
    });
  };

  /**
   * Draws the second private card and immediately resolves forced withdrawal.
   */
  const drawCard = (): void => {
    if (!state || state.phase !== "turn") {
      throw new Error("補充できる手番ではありません");
    }

    const actor = state.players.find((player) => player.id === state.activePlayerId);

    if (!actor || actor.hand.length !== 1) {
      throw new Error("密書は手札が一枚の時だけ補充できます");
    }

    const next = beginTurn(state);
    const updatedActor = next.players.find(
      (player) => player.id === next.activePlayerId,
    );

    if (updatedActor?.eliminated) {
      completeTurn(next);
      return;
    }

    update(next);
  };

  /**
   * Resolves a selected role and pauses only when private information is shown.
   */
  const playCard = (choice: PlayChoice): void => {
    if (!state || state.phase !== "turn") {
      throw new Error("密書を使用できる手番ではありません");
    }

    const resolved = resolvePlay(state, choice);

    if (resolved.privateReveal) {
      update({ ...resolved, phase: "private-reveal" });
      return;
    }

    completeTurn(resolved);
  };

  /**
   * Removes temporary information from the screen before locking the device.
   */
  const closePrivateReveal = (): void => {
    if (!state || state.phase !== "private-reveal" || !state.privateReveal) {
      throw new Error("閉じられる確認結果がありません");
    }

    completeTurn({ ...state, privateReveal: null });
  };

  /**
   * Deals the next scored round while preserving seats, scores, and starter.
   */
  const continueMatch = (): void => {
    if (!state || state.phase !== "round-result" || !state.roundOutcome) {
      throw new Error("続行できるラウンド結果ではありません");
    }

    const starterIndex = state.players.findIndex(
      (player) => player.id === state.roundOutcome?.nextStarterId,
    );
    const fresh = startRound(
      {
        names: state.players.map((player) => player.name),
        matchMode: state.matchMode,
      },
      random,
    );
    const players = fresh.players.map((player, index) => ({
      ...player,
      score: state.players[index]?.score ?? 0,
    }));

    update({
      ...fresh,
      players,
      activePlayerId: players[starterIndex]?.id ?? fresh.activePlayerId,
    });
  };

  /**
   * Clears a completed or abandoned local table before new setup.
   */
  const reset = (): void => {
    clearSession();
    setState(null);
  };

  return {
    state,
    publicView: state ? selectPublicView(state) : null,
    privateView:
      state?.phase === "turn" || state?.phase === "private-reveal"
        ? selectPrivateView(state, state.activePlayerId)
        : null,
    resultView:
      state?.phase === "round-result" || state?.phase === "match-result"
        ? selectResultView(state)
        : null,
    start,
    openHandoff,
    drawCard,
    playCard,
    closePrivateReveal,
    continueMatch,
    reset,
  };
}
