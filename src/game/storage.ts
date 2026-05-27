/** Validated local-device persistence for an in-progress offline session. */
import type {
  Card,
  GamePhase,
  GameState,
  PlayerState,
  PrivateReveal,
  PublicLogEntry,
  Rank,
} from "./types";

const SESSION_KEY = "midnight-masquerade.session";
const PHASES: readonly GamePhase[] = [
  "handoff",
  "turn",
  "private-reveal",
  "round-result",
  "match-result",
];

/**
 * Narrows arbitrary parsed JSON to an object record.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Checks that an unknown rank is one of the eight supported role ranks.
 */
function isRank(value: unknown): value is Rank {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 8
  );
}

/**
 * Validates a single serializable card instance.
 */
function isCard(value: unknown): value is Card {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isRank(value.rank) &&
    typeof value.name === "string" &&
    typeof value.summary === "string"
  );
}

/**
 * Validates a public log event without interpreting its text.
 */
function isLogEntry(value: unknown): value is PublicLogEntry {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.message === "string" &&
    typeof value.actorId === "string" &&
    isRank(value.cardRank)
  );
}

/**
 * Validates one serialized player and all cards publicly/private held by them.
 */
function isPlayer(value: unknown): value is PlayerState {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    Array.isArray(value.hand) &&
    value.hand.every(isCard) &&
    Array.isArray(value.discards) &&
    value.discards.every(isCard) &&
    typeof value.score === "number" &&
    Number.isInteger(value.score) &&
    value.score >= 0 &&
    typeof value.eliminated === "boolean" &&
    typeof value.protected === "boolean"
  );
}

/**
 * Validates a temporary private reveal without adding it to card ownership.
 */
function isPrivateReveal(value: unknown): value is PrivateReveal | null {
  return (
    value === null ||
    (isRecord(value) &&
      typeof value.viewerId === "string" &&
      isCard(value.card) &&
      (value.reason === "informant" ||
        value.reason === "exchange" ||
        value.reason === "redraw"))
  );
}

/**
 * Ensures owned cards form one non-duplicated serialized round partition.
 */
function hasUniqueOwnedCards(state: GameState): boolean {
  const cards = [
    ...state.deck,
    ...(state.hiddenRemoved ? [state.hiddenRemoved] : []),
    ...state.faceUpRemoved,
    ...state.players.flatMap((player) => [...player.hand, ...player.discards]),
  ];
  const ids = cards.map((card) => card.id);
  return ids.length === 16 && new Set(ids).size === ids.length;
}

/**
 * Validates persisted game JSON before it can reach UI or rules logic.
 */
function isGameState(value: unknown): value is GameState {
  if (
    !isRecord(value) ||
    !PHASES.includes(value.phase as GamePhase) ||
    !Array.isArray(value.players) ||
    value.players.length < 2 ||
    value.players.length > 4 ||
    !value.players.every(isPlayer) ||
    !Array.isArray(value.deck) ||
    !value.deck.every(isCard) ||
    !(value.hiddenRemoved === null || isCard(value.hiddenRemoved)) ||
    !Array.isArray(value.faceUpRemoved) ||
    !value.faceUpRemoved.every(isCard) ||
    typeof value.activePlayerId !== "string" ||
    !(value.matchMode === "single" || value.matchMode === "first-to-three") ||
    typeof value.turnNumber !== "number" ||
    !Number.isInteger(value.turnNumber) ||
    value.turnNumber < 0 ||
    !Array.isArray(value.publicLog) ||
    !value.publicLog.every(isLogEntry) ||
    !isPrivateReveal(value.privateReveal)
  ) {
    return false;
  }

  const state = value as unknown as GameState;
  const playerIds = state.players.map((player) => player.id);
  return (
    new Set(playerIds).size === playerIds.length &&
    playerIds.includes(state.activePlayerId) &&
    hasUniqueOwnedCards(state)
  );
}

/**
 * Persists an active offline session on the same phone.
 */
export function saveSession(state: GameState): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(state));
}

/**
 * Loads a validated session and removes malformed data instead of trusting it.
 */
export function loadSession(): GameState | null {
  const serialized = localStorage.getItem(SESSION_KEY);

  if (!serialized) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(serialized);

    if (isGameState(parsed)) {
      return parsed;
    }
  } catch {
    // Malformed persisted JSON is treated the same as a structurally bad state.
  }

  localStorage.removeItem(SESSION_KEY);
  return null;
}

/**
 * Removes any saved offline session when players leave the table.
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
