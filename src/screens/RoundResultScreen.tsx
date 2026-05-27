import type { PublicPlayerView } from "../game/selectors";
import type { GamePhase, MatchMode, RoundOutcome } from "../game/types";

interface RoundResultScreenProps {
  assetBase: string;
  phase: Extract<GamePhase, "round-result" | "match-result">;
  players: PublicPlayerView[];
  outcome: RoundOutcome;
  matchMode: MatchMode;
  onContinue(): void;
  onReset(): void;
}

/**
 * Returns display names for only the public victors of the current result view.
 */
function winnerNames(
  phase: RoundResultScreenProps["phase"],
  players: PublicPlayerView[],
  outcome: RoundOutcome,
): string[] {
  const winnerIds =
    phase === "match-result" ? outcome.matchWinnerIds : outcome.winners;

  return winnerIds.flatMap((id) => {
    const winner = players.find((player) => player.id === id);
    return winner ? [winner.name] : [];
  });
}

/**
 * Presents publicly shareable winners and score actions after a settled round.
 */
export function RoundResultScreen({
  assetBase,
  phase,
  players,
  outcome,
  matchMode,
  onContinue,
  onReset,
}: RoundResultScreenProps) {
  const names = winnerNames(phase, players, outcome);
  const headline =
    names.length === 1 ? `${names[0]}の勝利` : `${names.join("・")}の勝利`;
  const isMatchEnd = phase === "match-result";

  return (
    <main className="result-screen">
      <img
        alt=""
        aria-hidden="true"
        className="scene-backdrop"
        loading="lazy"
        src={`${assetBase}/victory-ballroom.webp`}
      />
      <div className="scene-veil" aria-hidden="true" />
      <section className="result-panel" aria-label="公開結果">
        <p className="eyebrow">{isMatchEnd ? "Finale" : "Round Finale"}</p>
        <h1>{isMatchEnd ? "夜会の結末" : "ラウンドの結末"}</h1>
        <p className="result-panel__winner">{headline}</p>
        {matchMode === "first-to-three" ? (
          <ol className="scoreboard" aria-label="得点">
            {players.map((player) => (
              <li key={player.id}>
                <span>{player.name}</span>
                <strong>{`${player.score} 点`}</strong>
              </li>
            ))}
          </ol>
        ) : null}
        {!isMatchEnd && matchMode === "first-to-three" ? (
          <button className="seal-button" onClick={onContinue} type="button">
            次の密書を配る
          </button>
        ) : (
          <button className="seal-button" onClick={onReset} type="button">
            新しい夜会を準備する
          </button>
        )}
      </section>
    </main>
  );
}
