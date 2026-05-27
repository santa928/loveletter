import "./styles/tokens.css";
import "./styles/app.css";

const assetBase = `${import.meta.env.BASE_URL}assets/art`;

/**
 * Presents the opening invitation for the offline masquerade game.
 *
 * The initial screen deliberately loads only its ballroom background; gameplay
 * imagery is loaded by later screens so the public entry remains lightweight.
 */
export default function App() {
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
        <button className="seal-button" type="button">
          夜会へ入る
        </button>
      </section>
    </main>
  );
}
