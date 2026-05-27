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
    summary: "相手の協力者を宣言し、見抜けば退出させる。",
  },
  {
    rank: 2,
    name: "情報屋",
    count: 2,
    summary: "相手の協力者を自分だけが確認する。",
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
    summary: "選んだ招待客の協力者を交代させる。",
  },
  {
    rank: 6,
    name: "交換商",
    count: 1,
    summary: "相手と協力者を密かに交換する。",
  },
  {
    rank: 7,
    name: "総支配人",
    count: 1,
    summary: "高位の協力者と重なると即座に退出する。",
  },
  {
    rank: 8,
    name: "夜会の主",
    count: 1,
    summary: "この協力者を手放すと直ちに退出する。",
  },
];

/**
 * Creates a fresh sixteen-card deck using the masquerade's original role names.
 */
export function createDeck(): Card[] {
  return CARD_DEFINITIONS.flatMap((definition) =>
    Array.from({ length: definition.count }, (_, copyIndex) => ({
      ...definition,
      id: `rank-${definition.rank}-${copyIndex + 1}`,
    })),
  );
}
