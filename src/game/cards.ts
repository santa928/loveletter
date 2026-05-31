/** Immutable card definitions and fresh deck construction for the night party. */
import type { Card, Rank } from "./types";

interface CardDefinition {
  rank: Rank;
  name: string;
  count: number;
  summary: string;
}

const CARD_DEFINITIONS: readonly CardDefinition[] = [
  {
    rank: 1,
    name: "門番",
    count: 5,
    summary: "相手の手札の人物を宣言し、当たれば退出させる。",
  },
  {
    rank: 2,
    name: "情報屋",
    count: 2,
    summary: "相手の手札カードを自分だけが確認する。",
  },
  {
    rank: 3,
    name: "決闘士",
    count: 2,
    summary: "相手と位階を比べ、低い側を退出させる。",
  },
  {
    rank: 4,
    name: "仮面の侍女",
    count: 2,
    summary: "次の自分の手番まで他者の効果を退ける。",
  },
  {
    rank: 5,
    name: "演出家",
    count: 2,
    summary: "選んだプレイヤーの手札カードを入れ替えさせる。",
  },
  {
    rank: 6,
    name: "交換商",
    count: 1,
    summary: "相手と手札カードを密かに交換する。",
  },
  {
    rank: 7,
    name: "総支配人",
    count: 1,
    summary: "位階5以上のカードと手札に並ぶと即座に退出する。",
  },
  {
    rank: 8,
    name: "夜会の主",
    count: 1,
    summary: "このカードを手放すと直ちに退出する。",
  },
];

/**
 * Creates a fresh sixteen-card deck using the masquerade's original role names.
 */
export function createDeck(): Card[] {
  return CARD_DEFINITIONS.flatMap(({ count, ...definition }) =>
    Array.from({ length: count }, (_, copyIndex) => ({
      ...definition,
      id: `rank-${definition.rank}-${copyIndex + 1}`,
    })),
  );
}
