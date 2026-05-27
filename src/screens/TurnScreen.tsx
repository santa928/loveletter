import type { Card } from "../game/types";

interface TurnScreenProps {
  assetBase: string;
  hand: Card[];
  playerName: string;
}

const portraitNames: Record<number, string> = {
  1: "rank-1-gatekeeper.webp",
  2: "rank-2-informant.webp",
  3: "rank-3-duelist.webp",
  4: "rank-4-attendant.webp",
  5: "rank-5-director.webp",
  6: "rank-6-merchant.webp",
  7: "rank-7-steward.webp",
  8: "rank-8-host.webp",
};

/**
 * Shows the current player's private starting hand after deliberate opening.
 */
export function TurnScreen({ assetBase, hand, playerName }: TurnScreenProps) {
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
          <article className="role-card" key={card.id}>
            <img
              alt={`${card.name}の仮面`}
              loading="lazy"
              src={`${assetBase}/roles/${portraitNames[card.rank]}`}
            />
            <div className="role-card__copy">
              <p className="role-card__rank">{`位階 ${card.rank}`}</p>
              <h3>{card.name}</h3>
              <p>{card.summary}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
