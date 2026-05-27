interface HandoffScreenProps {
  assetBase: string;
  playerName: string;
  onOpen(): void;
}

/**
 * Locks all private information while the device changes hands.
 */
export function HandoffScreen({
  assetBase,
  playerName,
  onOpen,
}: HandoffScreenProps) {
  return (
    <main className="handoff-screen">
      <div className="handoff-screen__glow" aria-hidden="true" />
      <img
        alt=""
        aria-hidden="true"
        className="handoff-screen__letter"
        loading="lazy"
        src={`${assetBase}/handoff-sealed-letter.webp`}
      />
      <section className="handoff-panel" aria-label="端末の受け渡し">
        <p className="eyebrow">Sealed Letter</p>
        <h1>{`${playerName}さんへ端末を渡してください`}</h1>
        <p>本人だけが画面を見られる状態で、封印を解いてください。</p>
        <button className="seal-button" onClick={onOpen} type="button">
          密書を開封する
        </button>
      </section>
    </main>
  );
}
