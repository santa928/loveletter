import type { Card } from "../game/types";

interface RoleCardProps {
  assetBase: string;
  card: Card;
  compact?: boolean;
  actionLabel?: string;
  onAction?(): void;
}

const portraitNames: Record<number, string> = {
  1: "rank-1-gatekeeper.webp",
  2: "rank-2-informant.webp",
  3: "rank-3-duelist.webp",
  4: "rank-4-attendant.webp",
  5: "rank-5-director.webp",
  6: "rank-6-merchant.webp",
  7: "rank-7-steward.webp",
  8: "rank-8-host.webp",
};

/**
 * Renders a private role portrait and an optional deliberate play action.
 */
export function RoleCard({
  assetBase,
  card,
  compact = false,
  actionLabel,
  onAction,
}: RoleCardProps) {
  return (
    <article className={`role-card${compact ? " role-card--choice" : ""}`}>
      <img
        alt={`${card.name}の仮面`}
        loading="lazy"
        src={`${assetBase}/roles/${portraitNames[card.rank]}`}
      />
      <div className="role-card__copy">
        <p className="role-card__rank">{`位階 ${card.rank}`}</p>
        <h3>{card.name}</h3>
        <p className="role-card__summary">
          <span>効果</span>
          {card.summary}
        </p>
        {actionLabel && onAction ? (
          <button className="role-card__action" onClick={onAction} type="button">
            {actionLabel}
          </button>
        ) : null}
      </div>
    </article>
  );
}
