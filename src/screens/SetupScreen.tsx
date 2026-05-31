import { useState, type FormEvent } from "react";
import type { MatchMode, SetupConfig } from "../game/types";

interface SetupScreenProps {
  assetBase: string;
  onStart(config: SetupConfig): void;
}

/**
 * Collects public round settings before any card is dealt.
 */
export function SetupScreen({ assetBase, onStart }: SetupScreenProps) {
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState(["", "", "", ""]);
  const [matchMode, setMatchMode] = useState<MatchMode>("single");

  /**
   * Submits only the invited player slots currently shown in the form.
   */
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onStart({ names: names.slice(0, playerCount), matchMode });
  };

  return (
    <main className="setup-screen">
      <img
        aria-hidden="true"
        className="scene-backdrop"
        loading="lazy"
        src={`${assetBase}/title-ballroom.webp`}
      />
      <div className="scene-veil" aria-hidden="true" />
      <form className="setup-panel" onSubmit={submit}>
        <p className="eyebrow">Invitation List</p>
        <h1>夜会の支度</h1>
        <p className="setup-panel__hint">
          プレイヤーを登録し、カードを一枚ずつ受け取る一夜を始めます。
        </p>
        <label className="field">
          <span>参加人数</span>
          <select
            onChange={(event) => setPlayerCount(Number(event.target.value))}
            value={playerCount}
          >
            {[2, 3, 4].map((count) => (
              <option key={count} value={count}>
                {count}人
              </option>
            ))}
          </select>
        </label>
        <fieldset className="name-list">
          <legend>プレイヤーの名前 <small>任意</small></legend>
          {Array.from({ length: playerCount }, (_, index) => (
            <label className="field field--compact" key={index}>
              <span>{`プレイヤー${index + 1}の名前`}</span>
              <input
                onChange={(event) =>
                  setNames((current) =>
                    current.map((name, currentIndex) =>
                      currentIndex === index ? event.target.value : name,
                    ),
                  )
                }
                placeholder={`プレイヤー${index + 1}`}
                value={names[index]}
              />
            </label>
          ))}
        </fieldset>
        <label className="field">
          <span>対戦形式</span>
          <select
            onChange={(event) => setMatchMode(event.target.value as MatchMode)}
            value={matchMode}
          >
            <option value="single">1ラウンド勝負</option>
            <option value="first-to-three">3点先取戦</option>
          </select>
        </label>
        <button className="seal-button setup-panel__submit" type="submit">
          夜会を始める
        </button>
      </form>
    </main>
  );
}
