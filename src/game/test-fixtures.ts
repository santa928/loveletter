/** Minimal deterministic state builders used by rules and projection tests. */
import { createDeck } from "./cards";
import type { Card, GameState, Rank } from "./types";

/**
 * Creates a uniquely identified card instance from a role definition.
 */
export function fixtureCard(rank: Rank, id: string): Card {
  const definition = createDeck().find((card) => card.rank === rank);

  if (!definition) {
    throw new Error(`位階${rank}のカード定義がありません`);
  }

  return { ...definition, id };
}

interface RuleStateOptions {
  actorHand: Card[];
  targetHand: Card[];
  deck?: Card[];
  hiddenRemoved?: Card | null;
  targetProtected?: boolean;
}

/**
 * Creates a two-player active-turn state with controlled private hands.
 */
export function ruleState({
  actorHand,
  targetHand,
  deck = [],
  hiddenRemoved = fixtureCard(1, "hidden-removed"),
  targetProtected = false,
}: RuleStateOptions): GameState {
  return {
    phase: "turn",
    players: [
      {
        id: "p1",
        name: "葵",
        hand: actorHand,
        discards: [],
        score: 0,
        eliminated: false,
        protected: false,
      },
      {
        id: "p2",
        name: "優斗",
        hand: targetHand,
        discards: [],
        score: 0,
        eliminated: false,
        protected: targetProtected,
      },
    ],
    deck,
    hiddenRemoved,
    faceUpRemoved: [],
    activePlayerId: "p1",
    turnNumber: 1,
    matchMode: "single",
    publicLog: [],
    privateReveal: null,
    roundOutcome: null,
  };
}
