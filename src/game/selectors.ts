/** Read-only projections that prevent secret round data from reaching screens. */
import type { Card, GamePhase, GameState, MatchMode, Rank } from "./types";

export interface PublicPlayerView {
  id: string;
  name: string;
  discards: Card[];
  score: number;
  eliminated: boolean;
  protected: boolean;
}

export interface PublicGameView {
  phase: GamePhase;
  players: PublicPlayerView[];
  deckCount: number;
  faceUpRemoved: Card[];
  activePlayerId: string;
  turnNumber: number;
  matchMode: MatchMode;
  log: Array<{ id: string; message: string; actorId: string; cardRank: Rank }>;
}

export interface PrivateGameView {
  hand: Card[];
  revealedCard: Card | null;
}

/**
 * Projects only information that every invitee may see while the phone moves.
 */
export function selectPublicView(state: GameState): PublicGameView {
  return {
    phase: state.phase,
    players: state.players.map((player) => ({
      id: player.id,
      name: player.name,
      discards: player.discards,
      score: player.score,
      eliminated: player.eliminated,
      protected: player.protected,
    })),
    deckCount: state.deck.length,
    faceUpRemoved: state.faceUpRemoved,
    activePlayerId: state.activePlayerId,
    turnNumber: state.turnNumber,
    matchMode: state.matchMode,
    log: state.publicLog,
  };
}

/**
 * Projects secret information only for the player currently opening the phone.
 */
export function selectPrivateView(
  state: GameState,
  viewerId: string,
): PrivateGameView {
  const viewer = state.players.find((player) => player.id === viewerId);

  if (!viewer) {
    throw new Error("指定されたプレイヤーが存在しません");
  }

  return {
    hand: viewer.hand,
    revealedCard:
      state.privateReveal?.viewerId === viewerId
        ? state.privateReveal.card
        : null,
  };
}
