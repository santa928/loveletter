import { useState, type ReactNode } from "react";
import { useCeremonyAudio } from "./app/useCeremonyAudio";
import { useGameSession } from "./app/useGameSession";
import { HandoffScreen } from "./screens/HandoffScreen";
import { PrivateRevealScreen } from "./screens/PrivateRevealScreen";
import { RoundResultScreen } from "./screens/RoundResultScreen";
import { SetupScreen } from "./screens/SetupScreen";
import { SoundToggle } from "./screens/SoundToggle";
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

interface AppSurfaceProps {
  children: ReactNode;
  muted: boolean;
  onToggleSound(): void;
}

/**
 * Adds the table-wide audio control above any active ceremony screen.
 */
function AppSurface({
  children,
  muted,
  onToggleSound,
}: AppSurfaceProps) {
  return (
    <>
      <SoundToggle muted={muted} onToggle={onToggleSound} />
      {children}
    </>
  );
}

/**
 * Routes entry and pass-play screens while keeping secret state behind views.
 */
export default function App({ initialState, random }: AppProps = {}) {
  const [entryScreen, setEntryScreen] = useState<"title" | "setup">("title");
  const audio = useCeremonyAudio();
  const session = useGameSession(initialState, random);

  if (!session.state) {
    return (
      <AppSurface muted={audio.muted} onToggleSound={audio.toggleMuted}>
        {entryScreen === "title" ? (
          <TitleScreen
            assetBase={assetBase}
            onEnter={() => {
              audio.play("enter");
              setEntryScreen("setup");
            }}
          />
        ) : (
          <SetupScreen
            assetBase={assetBase}
            onStart={(config) => {
              audio.play("seal");
              session.start(config);
            }}
          />
        )}
      </AppSurface>
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
      <AppSurface muted={audio.muted} onToggleSound={audio.toggleMuted}>
        <HandoffScreen
          assetBase={assetBase}
          onOpen={() => {
            audio.play("seal");
            session.openHandoff();
          }}
          playerName={activePlayer.name}
        />
      </AppSurface>
    );
  }

  if (session.state.phase === "turn") {
    return (
      <AppSurface muted={audio.muted} onToggleSound={audio.toggleMuted}>
        <TurnScreen
          assetBase={assetBase}
          hand={session.privateView?.hand ?? []}
          onDraw={() => {
            audio.play("draw");
            session.drawCard();
          }}
          onPlay={(choice) => {
            audio.play("play");
            session.playCard(choice);
          }}
          playerName={activePlayer.name}
          publicView={session.publicView}
        />
      </AppSurface>
    );
  }

  if (session.state.phase === "private-reveal") {
    const revealedCard = session.privateView?.revealedCard;
    const reason = session.state.privateReveal?.reason;

    if (!revealedCard || !reason) {
      throw new Error("確認すべき密書が見つかりません");
    }

    return (
      <AppSurface muted={audio.muted} onToggleSound={audio.toggleMuted}>
        <PrivateRevealScreen
          assetBase={assetBase}
          card={revealedCard}
          onClose={() => {
            audio.play("reveal");
            session.closePrivateReveal();
          }}
          reason={reason}
        />
      </AppSurface>
    );
  }

  if (
    (session.state.phase === "round-result" ||
      session.state.phase === "match-result") &&
    session.publicView.roundOutcome
  ) {
    return (
      <AppSurface muted={audio.muted} onToggleSound={audio.toggleMuted}>
        <RoundResultScreen
          assetBase={assetBase}
          matchMode={session.publicView.matchMode}
          onContinue={() => {
            audio.play("enter");
            session.continueMatch();
          }}
          onReset={() => {
            audio.play("enter");
            session.reset();
            setEntryScreen("setup");
          }}
          outcome={session.publicView.roundOutcome}
          phase={session.state.phase}
          players={session.publicView.players}
        />
      </AppSurface>
    );
  }

  return null;
}
