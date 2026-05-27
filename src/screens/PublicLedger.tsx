import type { PublicGameView } from "../game/selectors";

interface PublicLedgerProps {
  resolving: boolean;
  view: PublicGameView;
}

/**
 * Shows only table-wide knowledge needed for deduction during a private turn.
 */
export function PublicLedger({ resolving, view }: PublicLedgerProps) {
  return (
    <aside className="public-ledger" aria-label="公開状況">
      <div className="public-ledger__meters">
        <p aria-label={`山札 ${view.deckCount}枚`}>
          <span>山札</span>
          <strong>{`${view.deckCount}枚`}</strong>
        </p>
        <p>
          <span>進行</span>
          <strong>{resolving ? "解決中" : "補充前"}</strong>
        </p>
      </div>
      <details>
        <summary>公開された記録</summary>
        <div className="public-ledger__drawer">
          {view.faceUpRemoved.length > 0 ? (
            <section>
              <h2>公開除外</h2>
              <ul className="ledger-cards">
                {view.faceUpRemoved.map((card) => (
                  <li key={card.id}>{card.name}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {view.players.map((player) => (
            <section key={player.id}>
              <h2>{player.name}</h2>
              {player.discards.length > 0 ? (
                <ul className="ledger-cards">
                  {player.discards.map((card) => (
                    <li key={card.id}>{card.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="ledger-empty">使用済みなし</p>
              )}
            </section>
          ))}
          {view.log.length > 0 ? (
            <section className="ledger-log">
              <h2>夜会の記録</h2>
              <ol>
                {view.log.map((entry) => (
                  <li key={entry.id}>{entry.message}</li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>
      </details>
    </aside>
  );
}
