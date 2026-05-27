/** Pure setup operations for an offline pass-play round. */
import { createDeck } from "./cards";
import type { Card, GameState, PlayerState, SetupConfig } from "./types";

type RandomSource = () => number;

/**
 * Replaces blank player names with numbered defaults and trims entered names.
 */
export function normalizeNames(names: readonly string[]): string[] {
  return names.map((name, index) => {
    const normalized = name.trim();
    return normalized || `プレイヤー${index + 1}`;
  });
}

/**
 * Returns a valid zero-based random index, rejecting invalid random sources.
 */
function randomIndex(length: number, random: RandomSource): number {
  const value = random();

  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new Error("乱数は0以上1未満である必要があります");
  }

  return Math.floor(value * length);
}

/**
 * Shuffles a card list without changing its input, using an injectable source.
 */
function shuffleCards(cards: readonly Card[], random: RandomSource): Card[] {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swappedIndex = randomIndex(index + 1, random);
    [shuffled[index], shuffled[swappedIndex]] = [
      shuffled[swappedIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

/**
 * Creates initial player state for an offline pass-play round.
 */
function createPlayers(names: readonly string[]): PlayerState[] {
  return normalizeNames(names).map((name, index) => ({
    id: `player-${index + 1}`,
    name,
    hand: [],
    discards: [],
    score: 0,
    eliminated: false,
    protectedUntilTurn: null,
  }));
}

/**
 * Starts a round by shuffling, removing hidden/public cards, dealing, and
 * selecting the first invitee to receive the phone.
 */
export function startRound(
  config: SetupConfig,
  random: RandomSource = Math.random,
): GameState {
  if (config.names.length < 2 || config.names.length > 4) {
    throw new Error("参加人数は2人から4人で指定してください");
  }

  const deck = shuffleCards(createDeck(), random);
  const hiddenRemoved = deck.shift();

  if (!hiddenRemoved) {
    throw new Error("山札の準備に失敗しました");
  }

  const faceUpRemoved = config.names.length === 2 ? deck.splice(0, 3) : [];
  const players = createPlayers(config.names);

  players.forEach((player) => {
    const dealtCard = deck.shift();

    if (!dealtCard) {
      throw new Error("配札に失敗しました");
    }

    player.hand.push(dealtCard);
  });

  return {
    phase: "handoff",
    players,
    deck,
    hiddenRemoved,
    faceUpRemoved,
    activePlayerId: players[randomIndex(players.length, random)].id,
    turnNumber: 0,
    matchMode: config.matchMode,
    publicLog: [],
    privateReveal: null,
  };
}
