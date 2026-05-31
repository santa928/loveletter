import type { Card, PrivateReveal } from "../game/types";
import { RoleCard } from "./RoleCard";

interface PrivateRevealScreenProps {
  assetBase: string;
  card: Card;
  reason: PrivateReveal["reason"];
  onClose(): void;
}

const revealTitles: Record<PrivateReveal["reason"], string> = {
  informant: "情報屋の報せ",
  exchange: "交換後のカード",
  redraw: "引き直したカード",
};

/**
 * Displays temporary secret knowledge only until the viewer explicitly closes it.
 */
export function PrivateRevealScreen({
  assetBase,
  card,
  reason,
  onClose,
}: PrivateRevealScreenProps) {
  return (
    <main className="reveal-screen">
      <header className="turn-screen__header">
        <p className="eyebrow">For Your Eyes Only</p>
        <h1>{revealTitles[reason]}</h1>
        <p className="turn-screen__privacy">
          この内容は口に出さず、確認後に画面を閉じてください
        </p>
      </header>
      <section className="private-hand" aria-label="確認したカード">
        <RoleCard assetBase={assetBase} card={card} />
      </section>
      <button className="seal-button reveal-screen__close" onClick={onClose} type="button">
        確認して閉じる
      </button>
    </main>
  );
}
