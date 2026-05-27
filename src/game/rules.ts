/** Pure card-effect resolution for a round of Midnight Masquerade. */
import type { GameState, PlayerState, Rank } from "./types";

export interface PlayChoice {
  cardId: string;
  targetId?: string;
  declaredRank?: Rank;
}

/**
 * Produces a writable round copy without mutating prior state references.
 */
function cloneState(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      hand: [...player.hand],
      discards: [...player.discards],
    })),
    deck: [...state.deck],
    faceUpRemoved: [...state.faceUpRemoved],
    publicLog: [...state.publicLog],
    privateReveal: state.privateReveal
      ? { ...state.privateReveal }
      : null,
  };
}

/**
 * Returns the currently acting player or rejects a corrupt state.
 */
function activePlayer(state: GameState): PlayerState {
  const actor = state.players.find(
    (player) => player.id === state.activePlayerId,
  );

  if (!actor || actor.eliminated) {
    throw new Error("手番プレイヤーが存在しないか、既に退出しています");
  }

  return actor;
}

/**
 * Appends one public event without embedding any secret hand information.
 */
function appendLog(
  state: GameState,
  actorId: string,
  cardRank: Rank,
  message: string,
): void {
  state.publicLog.push({
    id: `log-${state.publicLog.length + 1}`,
    actorId,
    cardRank,
    message,
  });
}

/**
 * Moves all cards held by an eliminated player into their public discard pile.
 */
function eliminate(
  state: GameState,
  player: PlayerState,
  actorId: string,
  cardRank: Rank,
  message: string,
): void {
  player.discards.push(...player.hand);
  player.hand = [];
  player.eliminated = true;
  player.protected = false;
  appendLog(state, actorId, cardRank, message);
}

/**
 * Returns a selected player, rejecting missing selections for target effects.
 */
function targetPlayer(state: GameState, targetId: string | undefined): PlayerState {
  const target = state.players.find((player) => player.id === targetId);

  if (!target || target.eliminated) {
    throw new Error("効果対象となる招待客を選択してください");
  }

  return target;
}

/**
 * Checks whether a different player's protection cancels an incoming effect.
 */
function cancelIfProtected(
  state: GameState,
  actor: PlayerState,
  target: PlayerState,
  rank: Rank,
): boolean {
  if (actor.id === target.id || !target.protected) {
    return false;
  }

  appendLog(state, actor.id, rank, "庇護により効果は届かなかった。");
  return true;
}

/**
 * Draws one card for the active player and evaluates the steward's immediate
 * elimination rule before any card choice is made.
 */
export function beginTurn(state: GameState): GameState {
  const next = cloneState(state);
  const actor = activePlayer(next);
  const drawnCard = next.deck.shift();

  if (!drawnCard) {
    throw new Error("補充できる山札がありません");
  }

  actor.protected = false;
  actor.hand.push(drawnCard);
  next.turnNumber += 1;
  next.phase = "turn";

  const holdsSteward = actor.hand.some((card) => card.rank === 7);
  const rankTotal = actor.hand.reduce((total, card) => total + card.rank, 0);

  if (holdsSteward && rankTotal >= 12) {
    eliminate(
      next,
      actor,
      actor.id,
      7,
      `${actor.name}は密書を封印され、夜会から退出した。`,
    );
  }

  return next;
}

/**
 * Resolves a played role card while preserving hidden hand information.
 */
export function resolvePlay(state: GameState, choice: PlayChoice): GameState {
  const next = cloneState(state);
  const actor = activePlayer(next);
  const cardIndex = actor.hand.findIndex((card) => card.id === choice.cardId);

  if (cardIndex < 0) {
    throw new Error("使用するカードが手札にありません");
  }

  const [playedCard] = actor.hand.splice(cardIndex, 1);
  actor.discards.push(playedCard);
  next.privateReveal = null;

  switch (playedCard.rank) {
    case 1: {
      const target = targetPlayer(next, choice.targetId);
      if (target.id === actor.id || choice.declaredRank === undefined || choice.declaredRank === 1) {
        throw new Error("門番は他の招待客と門番以外の役職を指定してください");
      }
      if (cancelIfProtected(next, actor, target, playedCard.rank)) {
        return next;
      }
      if (target.hand[0]?.rank === choice.declaredRank) {
        eliminate(
          next,
          target,
          actor.id,
          playedCard.rank,
          `${target.name}は門番に見抜かれ、退出した。`,
        );
      } else {
        appendLog(next, actor.id, playedCard.rank, "門番の問いは外れた。");
      }
      return next;
    }
    case 2: {
      const target = targetPlayer(next, choice.targetId);
      if (target.id === actor.id) {
        throw new Error("情報屋は他の招待客を指定してください");
      }
      if (cancelIfProtected(next, actor, target, playedCard.rank)) {
        return next;
      }
      const revealedCard = target.hand[0];
      if (!revealedCard) {
        throw new Error("対象の預け先を確認できません");
      }
      next.privateReveal = {
        viewerId: actor.id,
        card: revealedCard,
        reason: "informant",
      };
      appendLog(next, actor.id, playedCard.rank, "情報屋が密かに調査した。");
      return next;
    }
    case 3: {
      const target = targetPlayer(next, choice.targetId);
      if (target.id === actor.id) {
        throw new Error("決闘士は他の招待客を指定してください");
      }
      if (cancelIfProtected(next, actor, target, playedCard.rank)) {
        return next;
      }
      const actorCard = actor.hand[0];
      const targetCard = target.hand[0];
      if (!actorCard || !targetCard) {
        throw new Error("決闘に必要な預け先がありません");
      }
      if (actorCard.rank < targetCard.rank) {
        eliminate(next, actor, actor.id, playedCard.rank, `${actor.name}は決闘に敗れ、退出した。`);
      } else if (actorCard.rank > targetCard.rank) {
        eliminate(next, target, actor.id, playedCard.rank, `${target.name}は決闘に敗れ、退出した。`);
      } else {
        appendLog(next, actor.id, playedCard.rank, "決闘は互角に終わった。");
      }
      return next;
    }
    case 4:
      actor.protected = true;
      appendLog(next, actor.id, playedCard.rank, `${actor.name}は仮面の庇護を受けた。`);
      return next;
    case 5: {
      const target = targetPlayer(next, choice.targetId);
      if (cancelIfProtected(next, actor, target, playedCard.rank)) {
        return next;
      }
      const discardedCard = target.hand.shift();
      if (!discardedCard) {
        throw new Error("交代させる預け先がありません");
      }
      target.discards.push(discardedCard);
      if (discardedCard.rank === 8) {
        eliminate(next, target, actor.id, playedCard.rank, `${target.name}は夜会の主を手放し、退出した。`);
        return next;
      }
      const replacement = next.deck.shift() ?? next.hiddenRemoved;
      if (!replacement) {
        throw new Error("引き直せるカードがありません");
      }
      if (replacement === next.hiddenRemoved) {
        next.hiddenRemoved = null;
      }
      target.hand.push(replacement);
      if (target.id === actor.id) {
        next.privateReveal = {
          viewerId: actor.id,
          card: replacement,
          reason: "redraw",
        };
      }
      appendLog(next, actor.id, playedCard.rank, `${target.name}の預け先が交代した。`);
      return next;
    }
    case 6: {
      const target = targetPlayer(next, choice.targetId);
      if (target.id === actor.id) {
        throw new Error("交換商は他の招待客を指定してください");
      }
      if (cancelIfProtected(next, actor, target, playedCard.rank)) {
        return next;
      }
      [actor.hand, target.hand] = [target.hand, actor.hand];
      const receivedCard = actor.hand[0];
      if (!receivedCard) {
        throw new Error("交換後の預け先を確認できません");
      }
      next.privateReveal = {
        viewerId: actor.id,
        card: receivedCard,
        reason: "exchange",
      };
      appendLog(next, actor.id, playedCard.rank, "交換商が密書の預け先を入れ替えた。");
      return next;
    }
    case 7:
      appendLog(next, actor.id, playedCard.rank, `${actor.name}は総支配人を退かせた。`);
      return next;
    case 8:
      eliminate(next, actor, actor.id, playedCard.rank, `${actor.name}は夜会の主を手放し、退出した。`);
      return next;
  }
}
