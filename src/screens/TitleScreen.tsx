import { useState } from "react";

interface TitleScreenProps {
  assetBase: string;
  onEnter(): void;
}

type HomeGuide = "how-to" | "tutorial";

const glossary = [
  ["密書", "このゲームで使うカードのこと"],
  ["協力者", "手札カードに描かれた人物のこと"],
  ["招待客", "いま遊んでいるプレイヤーのこと"],
] as const;

const guideContent: Record<
  HomeGuide,
  {
    title: string;
    lead: string;
    items: readonly string[];
  }
> = {
  "how-to": {
    title: "遊び方",
    lead: "2〜4人で1台の端末を順に渡し、最後まで自分のカードを守る人を探ります。",
    items: [
      "自分の番だけ端末を見て、カードを一枚引きます。",
      "手札二枚のうち一枚を使い、カードに書かれた効果を解決します。",
      "他の人の手札は見せません。確認が終わったら画面を閉じて渡します。",
      "山札が尽きるか一人だけ残ったら、最も強いカードの持ち主が勝利します。",
    ],
  },
  tutorial: {
    title: "チュートリアル",
    lead: "初回はこの流れを声に出してから始めると、親戚や会社の集まりでも迷いません。",
    items: [
      "1. 名前を入れずに始めても、プレイヤー1〜4で進行できます。",
      "2. 端末を渡された人だけが「カードを確認する」を押します。",
      "3. カードの効果説明を読み、対象が必要なら画面の候補から選びます。",
      "4. 秘密確認が出たら本人だけが読み、閉じてから次の人へ渡します。",
    ],
  },
};

/**
 * Renders the selected public home guide without exposing any private game state.
 */
function HomeGuidePanel({
  guide,
  onClose,
}: {
  guide: HomeGuide;
  onClose(): void;
}) {
  const content = guideContent[guide];

  return (
    <section className="home-guide" aria-label={content.title}>
      <div>
        <p className="home-guide__eyebrow">Before the Ball</p>
        <h2>{content.title}</h2>
        <p>{content.lead}</p>
      </div>
      <ol>
        {content.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
      <dl className="home-guide__glossary" aria-label="ことばの早見表">
        {glossary.map(([term, description]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{description}</dd>
          </div>
        ))}
      </dl>
      <button className="home-guide__close" onClick={onClose} type="button">
        案内を閉じる
      </button>
    </section>
  );
}

/**
 * Presents the invitation before any private round state is created.
 */
export function TitleScreen({ assetBase, onEnter }: TitleScreenProps) {
  const [openGuide, setOpenGuide] = useState<HomeGuide | null>(null);

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
        <div className="invitation__guides" aria-label="夜会の案内">
          <button onClick={() => setOpenGuide("how-to")} type="button">
            遊び方を見る
          </button>
          <button onClick={() => setOpenGuide("tutorial")} type="button">
            チュートリアル
          </button>
        </div>
        {openGuide ? (
          <HomeGuidePanel guide={openGuide} onClose={() => setOpenGuide(null)} />
        ) : null}
      </section>
    </main>
  );
}
