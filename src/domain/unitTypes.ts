import type { UnitType, UnitTypeId } from "./types";

/** Cada nível multiplica HP e dano por (1 + LEVEL_GAIN * (nível - 1)). */
export const LEVEL_GAIN = 0.25;

/**
 * Os seis Tipos de Unidade. Os três últimos só aparecem na loja depois do
 * Estágio indicado (Q4): seis opções de cara seriam um muro de escolhas sem
 * informação para decidir.
 */
export const UNIT_TYPES: Record<UnitTypeId, UnitType> = {
  // Linha de frente: aguenta, e a Armadura faz tiro fraco e rápido ricochetear.
  warrior: {
    id: "warrior",
    name: "Guerreiro",
    short: "GUE",
    hp: 70,
    damage: 9,
    armor: 3,
    attackInterval: 1,
    range: 8,
    speed: 22,
    unlockCost: 0,
  },
  archer: {
    id: "archer",
    name: "Arqueiro",
    short: "ARQ",
    hp: 25,
    damage: 6,
    armor: 0,
    attackInterval: 0.8,
    range: 60,
    speed: 26,
    unlockCost: 120,
  },
  // Cerco: alcance longo, ritmo lento, dano alto — a resposta a Armadura.
  bomber: {
    id: "bomber",
    name: "Bombardeiro",
    short: "BOM",
    hp: 40,
    damage: 34,
    armor: 1,
    attackInterval: 3.5,
    range: 110,
    speed: 14,
    unlockCost: 400,
  },
  // Enxame barato: morre fácil, mas ocupa a mira das Armas de alvo único.
  pawn: {
    id: "pawn",
    name: "Peão",
    short: "PEA",
    hp: 34,
    damage: 6,
    armor: 0,
    attackInterval: 0.7,
    range: 8,
    speed: 34,
    unlockCost: 200,
    unlockedByStage: "lizard-nest",
  },
  // Meio-termo: alcance curto que já não é corpo-a-corpo, e aguenta pancada.
  lancer: {
    id: "lancer",
    name: "Lanceiro",
    short: "LAN",
    hp: 60,
    damage: 16,
    armor: 2,
    attackInterval: 1.3,
    range: 28,
    speed: 24,
    unlockCost: 650,
    unlockedByStage: "bear-den",
  },
  // Rápido e frágil: chega antes de todo mundo e bate muito, se sobreviver.
  thief: {
    id: "thief",
    name: "Ladino",
    short: "LAD",
    hp: 30,
    damage: 14,
    armor: 0,
    attackInterval: 0.45,
    range: 10,
    speed: 42,
    unlockCost: 1200,
    unlockedByStage: "wood-fort",
  },
};

export function unitTypeById(id: UnitTypeId): UnitType {
  const type = UNIT_TYPES[id];
  if (!type) throw new Error(`Tipo de Unidade desconhecido: ${id}`);
  return type;
}

/** HP de uma Unidade deste tipo no nível dado. */
export function hpAtLevel(type: UnitType, level: number): number {
  return Math.round(type.hp * (1 + LEVEL_GAIN * (level - 1)));
}

/** Dano de uma Unidade deste tipo no nível dado. */
export function damageAtLevel(type: UnitType, level: number): number {
  return Math.round(type.damage * (1 + LEVEL_GAIN * (level - 1)));
}
