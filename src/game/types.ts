/** Domain types shared by the offline round engine and later view projections. */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type MatchMode = "single" | "first-to-three";
export type GamePhase =
  | "handoff"
  | "turn"
  | "private-reveal"
  | "round-result"
  | "match-result";

export interface Card {
  id: string;
  rank: Rank;
  name: string;
  count: number;
  summary: string;
}

export interface SetupConfig {
  names: string[];
  matchMode: MatchMode;
}

export interface PlayerState {
  id: string;
  name: string;
  hand: Card[];
  discards: Card[];
  score: number;
  eliminated: boolean;
  protectedUntilTurn: number | null;
}

export interface PublicLogEntry {
  id: string;
  message: string;
  actorId: string;
  cardRank: Rank;
}

export interface PrivateReveal {
  viewerId: string;
  card: Card;
  reason: "informant" | "exchange" | "redraw";
}

export interface GameState {
  phase: GamePhase;
  players: PlayerState[];
  deck: Card[];
  hiddenRemoved: Card;
  faceUpRemoved: Card[];
  activePlayerId: string;
  turnNumber: number;
  matchMode: MatchMode;
  publicLog: PublicLogEntry[];
  privateReveal: PrivateReveal | null;
}
