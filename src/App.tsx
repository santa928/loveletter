import { useState } from "react";
import { useGameSession } from "./app/useGameSession";
import { HandoffScreen } from "./screens/HandoffScreen";
import { PrivateRevealScreen } from "./screens/PrivateRevealScreen";
import { RoundResultScreen } from "./screens/RoundResultScreen";
import { SetupScreen } from "./screens/SetupScreen";
import { TitleScreen } from "./screens/TitleScreen";
import { TurnScreen } from "./screens/TurnScreen";
import type { GameState } from "./game/types";
import "./styles/tokens.css";
import "./styles/app.css";

const assetBase = `${import.meta.env.BASE_URL}assets/art`;

interface AppProps {
  initialState?: GameState;
  random?: () => number;
}

/**
 * Routes entry and pass-play screens while keeping secret state behind views.
 */
export default function App({ initialState, random }: AppProps = {}) {
  const [entryScreen, setEntryScreen] = useState<"title" | "setup">("title");
  const session = useGameSession(initialState, random);

  if (!session.state) {
    return entryScreen === "title" ? (
      <TitleScreen assetBase={assetBase} onEnter={() => setEntryScreen("setup")} />
    ) : (
      <SetupScreen assetBase={assetBase} onStart={session.start} />
    );
  }

  const activePlayer = session.state.players.find(
    (player) => player.id === session.state?.activePlayerId,
  );

  if (!activePlayer) {
    throw new Error("手番の招待客が見つかりません");
  }

  if (!session.publicView) {
    throw new Error("公開できる夜会情報がありません");
  }

  if (session.state.phase === "handoff") {
    return (
      <HandoffScreen
        assetBase={assetBase}
        onOpen={session.openHandoff}
        playerName={activePlayer.name}
      />
    );
  }

  if (session.state.phase === "turn") {
    return (
      <TurnScreen
        assetBase={assetBase}
        activePlayerId={activePlayer.id}
        deckCount={session.publicView.deckCount}
        hand={session.privateView?.hand ?? []}
        onDraw={session.drawCard}
        onPlay={session.playCard}
        playerName={activePlayer.name}
        players={session.publicView.players}
      />
    );
  }

  if (session.state.phase === "private-reveal") {
    const revealedCard = session.privateView?.revealedCard;
    const reason = session.state.privateReveal?.reason;

    if (!revealedCard || !reason) {
      throw new Error("確認すべき密書が見つかりません");
    }

    return (
      <PrivateRevealScreen
        assetBase={assetBase}
        card={revealedCard}
        onClose={session.closePrivateReveal}
        reason={reason}
      />
    );
  }

  if (
    (session.state.phase === "round-result" ||
      session.state.phase === "match-result") &&
    session.publicView.roundOutcome
  ) {
    return (
      <RoundResultScreen
        assetBase={assetBase}
        matchMode={session.publicView.matchMode}
        onContinue={session.continueMatch}
        onReset={() => {
          session.reset();
          setEntryScreen("setup");
        }}
        outcome={session.publicView.roundOutcome}
        phase={session.state.phase}
        players={session.publicView.players}
      />
    );
  }

  return null;
}
