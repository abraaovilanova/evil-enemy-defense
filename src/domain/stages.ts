import type { Stage } from "./types";

/**
 * A escada de Estágios. Duas leituras dos números:
 *
 * - A **Guarnição** cresce de uma criatura solta até cinco membros com
 *   construção no centro. `x: 0` é o centro do campo; negativo é o lado
 *   esquerdo, positivo o direito. O Exército entra pelas duas pontas
 *   (±ENTRY_X), então tudo que estiver do lado oposto ao da sua coluna começa
 *   *atrás* dela.
 * - A **progressão de Formas** vai de criatura para construção: goblin, orc,
 *   lagarto, urso, minotauro, troll, e então madeira, pedra, castelo.
 */
export const STAGES: Stage[] = [
  {
    id: "goblin-camp",
    name: "Acampamento Goblin",
    baseReward: 40,
    firstClearBonus: 60,
    garrison: [{ formId: "goblin", x: 0 }],
  },
  {
    id: "orc-warcamp",
    name: "Forte dos Orcs",
    baseReward: 70,
    firstClearBonus: 110,
    garrison: [
      { formId: "great-orc", x: 0 },
      { formId: "goblin", x: -55 },
    ],
  },
  {
    id: "lizard-nest",
    name: "Ninho dos Lagartos",
    baseReward: 105,
    firstClearBonus: 170,
    garrison: [
      { formId: "lizard", x: 0 },
      { formId: "goblin", x: 60 },
      { formId: "goblin", x: -60 },
    ],
  },
  {
    id: "wood-outpost",
    name: "Posto de Madeira",
    baseReward: 150,
    firstClearBonus: 240,
    garrison: [
      { formId: "wood-tower", x: 0 },
      { formId: "great-orc", x: -50 },
      { formId: "goblin", x: 55 },
    ],
  },
  {
    id: "bear-den",
    name: "Toca do Urso",
    baseReward: 200,
    firstClearBonus: 320,
    garrison: [
      { formId: "bear", x: 0 },
      { formId: "lizard", x: 65 },
      { formId: "goblin", x: -70 },
    ],
  },
  {
    id: "minotaur-maze",
    name: "Labirinto do Minotauro",
    baseReward: 270,
    firstClearBonus: 430,
    garrison: [
      { formId: "minotaur", x: 0 },
      { formId: "lizard", x: -60 },
      { formId: "great-orc", x: 65 },
    ],
  },
  {
    id: "wood-fort",
    name: "Forte de Madeira",
    baseReward: 350,
    firstClearBonus: 560,
    garrison: [
      { formId: "wood-tower", x: 0 },
      { formId: "wood-tower", x: -55 },
      { formId: "bear", x: 60 },
      { formId: "great-orc", x: -105 },
    ],
  },
  {
    id: "troll-bridge",
    name: "Ponte do Troll",
    baseReward: 450,
    firstClearBonus: 720,
    garrison: [
      { formId: "troll", x: 0 },
      { formId: "bear", x: -65 },
      { formId: "lizard", x: 70 },
    ],
  },
  {
    id: "watchtower",
    name: "Torre de Vigia",
    baseReward: 580,
    firstClearBonus: 930,
    garrison: [
      { formId: "tower", x: 0 },
      { formId: "minotaur", x: 60 },
      { formId: "wood-tower", x: -60 },
      { formId: "lizard", x: -110 },
    ],
  },
  {
    id: "twin-towers",
    name: "Torres Gêmeas",
    baseReward: 740,
    firstClearBonus: 1180,
    garrison: [
      { formId: "tower-blue", x: 0 },
      { formId: "tower", x: -60 },
      { formId: "troll", x: 65 },
      { formId: "bear", x: -110 },
    ],
  },
  {
    id: "dark-fortress",
    name: "Fortaleza Sombria",
    baseReward: 950,
    firstClearBonus: 1520,
    garrison: [
      { formId: "tower-purple", x: 0 },
      { formId: "tower-blue", x: -60 },
      { formId: "minotaur", x: 60 },
      { formId: "troll", x: -115 },
      { formId: "lizard", x: 115 },
    ],
  },
  {
    id: "castle",
    name: "O Castelo",
    baseReward: 1250,
    firstClearBonus: 2000,
    garrison: [
      { formId: "castle", x: 0 },
      { formId: "tower-purple", x: -70 },
      { formId: "tower-blue", x: 70 },
      { formId: "troll", x: -120 },
      { formId: "minotaur", x: 120 },
    ],
  },
];

export function stageById(id: string): Stage {
  const stage = STAGES.find((s) => s.id === id);
  if (!stage) throw new Error(`Estágio desconhecido: ${id}`);
  return stage;
}

/** Índice do Estágio na escada, para regras de liberação. */
export function stageIndex(id: string): number {
  return STAGES.findIndex((s) => s.id === id);
}
