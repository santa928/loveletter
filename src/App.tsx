import { useState } from "react";
import { useGameSession } from "./app/useGameSession";
import { HandoffScreen } from "./screens/HandoffScreen";
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
        hand={session.privateView?.hand ?? []}
        playerName={activePlayer.name}
      />
    );
  }

  return null;
}
