interface TitleScreenProps {
  assetBase: string;
  onEnter(): void;
}

/**
 * Presents the invitation before any private round state is created.
 */
export function TitleScreen({ assetBase, onEnter }: TitleScreenProps) {
  return (
    <main className="title-screen">
      <img
        aria-hidden="true"
        className="title-screen__backdrop"
        fetchPriority="high"
        src={`${assetBase}/title-ballroom.webp`}
      />
      <div className="title-screen__veil" aria-hidden="true" />
      <section className="invitation" aria-label="夜会への招待">
        <div className="invitation__seal" aria-hidden="true">
          <span />
        </div>
        <h1 className="invitation__title">Midnight Masquerade</h1>
        <p className="invitation__subtitle">密書の夜会</p>
        <button className="seal-button" onClick={onEnter} type="button">
          夜会へ入る
        </button>
      </section>
    </main>
  );
}
