/** Round settlement and match scoring for the offline masquerade game. */
import type { GameState, PlayerState } from "./types";

export interface RoundResult {
  winners: string[];
  reason: "last-standing" | "deck-empty";
  scoresAwarded: Record<string, number>;
  nextStarterId: string;
  matchWinnerIds: string[];
}

/**
 * Returns the remaining held rank used to judge a deck-empty round.
 */
function heldRank(player: PlayerState): number {
  const heldCard = player.hand[0];

  if (!heldCard) {
    throw new Error("生存中の招待客に手札がありません");
  }

  return heldCard.rank;
}

/**
 * Identifies round winners after elimination or after the draw deck is empty.
 */
function identifyWinners(
  state: GameState,
): { winners: PlayerState[]; reason: RoundResult["reason"] } {
  const survivors = state.players.filter((player) => !player.eliminated);

  if (survivors.length === 1) {
    return { winners: survivors, reason: "last-standing" };
  }

  if (survivors.length === 0) {
    throw new Error("勝者を決められる招待客がいません");
  }

  if (state.deck.length > 0) {
    throw new Error("ラウンドはまだ決着していません");
  }

  const maximumRank = Math.max(...survivors.map(heldRank));

  return {
    winners: survivors.filter((player) => heldRank(player) === maximumRank),
    reason: "deck-empty",
  };
}

/**
 * Resolves winners, match points, next starter, and any simultaneous match win.
 */
export function settleRound(state: GameState): RoundResult {
  const { winners, reason } = identifyWinners(state);
  const scoresAwarded: Record<string, number> = {};

  if (state.matchMode === "first-to-three") {
    for (const winner of winners) {
      scoresAwarded[winner.id] = heldRank(winner) === 8 ? 2 : 1;
    }
  }

  const matchWinnerIds =
    state.matchMode === "first-to-three"
      ? winners
          .filter(
            (winner) =>
              winner.score + (scoresAwarded[winner.id] ?? 0) >= 3,
          )
          .map((winner) => winner.id)
      : [];

  return {
    winners: winners.map((winner) => winner.id),
    reason,
    scoresAwarded,
    nextStarterId: winners[0].id,
    matchWinnerIds,
  };
}

/**
 * Applies settled points and result routing while preserving the completed round.
 */
export function applyRoundResult(
  state: GameState,
  result: RoundResult,
): GameState {
  return {
    ...state,
    phase: result.matchWinnerIds.length > 0 ? "match-result" : "round-result",
    activePlayerId: result.nextStarterId,
    players: state.players.map((player) => ({
      ...player,
      hand: [...player.hand],
      discards: [...player.discards],
      score: player.score + (result.scoresAwarded[player.id] ?? 0),
    })),
    deck: [...state.deck],
    faceUpRemoved: [...state.faceUpRemoved],
    publicLog: [...state.publicLog],
    privateReveal: state.privateReveal ? { ...state.privateReveal } : null,
  };
}
