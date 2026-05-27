import { useState } from "react";
import type { PlayChoice } from "../game/rules";
import type { PublicPlayerView } from "../game/selectors";
import type { Card, Rank } from "../game/types";
import { RoleCard } from "./RoleCard";

interface TurnScreenProps {
  assetBase: string;
  activePlayerId: string;
  deckCount: number;
  hand: Card[];
  playerName: string;
  players: PublicPlayerView[];
  onDraw(): void;
  onPlay(choice: PlayChoice): void;
}

const declaredRoles: Array<{ rank: Exclude<Rank, 1>; name: string }> = [
  { rank: 2, name: "情報屋" },
  { rank: 3, name: "決闘士" },
  { rank: 4, name: "仮面の侍女" },
  { rank: 5, name: "演出家" },
  { rank: 6, name: "交換商" },
  { rank: 7, name: "総支配人" },
  { rank: 8, name: "夜会の主" },
];

/**
 * Determines whether a played role needs a selected invitee.
 */
function needsTarget(rank: Rank): boolean {
  return rank === 1 || rank === 2 || rank === 3 || rank === 5 || rank === 6;
}

/**
 * Determines whether the selected role may be directed at the acting player.
 */
function canTargetSelf(rank: Rank): boolean {
  return rank === 5;
};

/**
 * Lets the current viewer draw and deliberately resolve one private role card.
 */
export function TurnScreen({
  assetBase,
  activePlayerId,
  deckCount,
  hand,
  playerName,
  players,
  onDraw,
  onPlay,
}: TurnScreenProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const selectedCard = hand.find((card) => card.id === selectedCardId) ?? null;
  const selectableTargets = selectedCard
    ? players.filter(
        (player) =>
          !player.eliminated &&
          (canTargetSelf(selectedCard.rank) || player.id !== activePlayerId),
      )
    : [];

  /**
   * Plays immediate effects or opens the required target decision.
   */
  const chooseCard = (card: Card): void => {
    if (needsTarget(card.rank)) {
      setSelectedCardId(card.id);
      setSelectedTargetId(null);
      return;
    }

    onPlay({ cardId: card.id });
  };

  /**
   * Finishes target-only effects or advances the gatekeeper declaration.
   */
  const chooseTarget = (targetId: string): void => {
    if (!selectedCard) {
      throw new Error("使用する密書を先に選択してください");
    }

    if (selectedCard.rank === 1) {
      setSelectedTargetId(targetId);
      return;
    }

    onPlay({ cardId: selectedCard.id, targetId });
  };

  return (
    <main className="turn-screen">
      <header className="turn-screen__header">
        <p className="eyebrow">Private Letter</p>
        <h1>{`${playerName}さんの密書`}</h1>
        <p className="turn-screen__privacy">この画面は本人だけが確認してください</p>
      </header>
      <section className="private-hand" aria-label="あなたの手札">
        <h2>あなたの手札</h2>
        {hand.map((card) => (
          <RoleCard
            actionLabel={hand.length === 2 ? `${card.name}を使用する` : undefined}
            assetBase={assetBase}
            card={card}
            compact={hand.length === 2}
            key={card.id}
            onAction={hand.length === 2 ? () => chooseCard(card) : undefined}
          />
        ))}
        {hand.length === 1 && deckCount > 0 ? (
          <button className="seal-button draw-button" onClick={onDraw} type="button">
            密書を一枚引く
          </button>
        ) : null}
      </section>
      {selectedCard && needsTarget(selectedCard.rank) ? (
        <section className="decision-panel" aria-label="密書の対象選択">
          <h2>対象を選ぶ</h2>
          <div className="decision-panel__options">
            {selectableTargets.map((player) => (
              <button
                className="choice-button"
                key={player.id}
                onClick={() => chooseTarget(player.id)}
                type="button"
              >
                {`${player.name}${player.id === activePlayerId ? "（本人）" : ""}を対象にする`}
              </button>
            ))}
          </div>
          {selectedCard.rank === 1 && selectedTargetId ? (
            <>
              <h2>役職を宣言する</h2>
              <div className="decision-panel__roles">
                {declaredRoles.map((role) => (
                  <button
                    className="choice-button"
                    key={role.rank}
                    onClick={() =>
                      onPlay({
                        cardId: selectedCard.id,
                        targetId: selectedTargetId,
                        declaredRank: role.rank,
                      })
                    }
                    type="button"
                  >
                    {`${role.name}を宣言する`}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
