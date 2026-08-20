import type { DefenderForm } from "./types";

/**
 * As Formas que um Defensor pode ter.
 *
 * Regra de leitura dos números: **criatura** tem HP alto, Armadura baixa e
 * anda; **construção** tem Armadura alta, HP moderado e é fixa. É a Armadura
 * que faz as duas jogarem diferente — contra prédio, muitos tiros fracos não
 * passam (ADR 0004).
 */
export const FORMS: Record<string, DefenderForm> = {
  goblin: {
    id: "goblin",
    name: "Goblin",
    hp: 800,
    armor: 0,
    speed: 18,
    weapons: [
      { id: "adaga", damage: 20, interval: 1, range: 14, targeting: { kind: "foremost" } },
    ],
  },
  "great-orc": {
    id: "great-orc",
    name: "Orc Grande",
    hp: 950,
    armor: 2,
    speed: 15,
    weapons: [
      { id: "machado", damage: 30, interval: 1, range: 20, targeting: { kind: "foremost" } },
      { id: "lanca", damage: 14, interval: 1.5, range: 85, targeting: { kind: "lowestHp" } },
    ],
  },
  lizard: {
    id: "lizard",
    name: "Lagarto Cuspidor",
    hp: 820,
    armor: 1,
    speed: 20,
    weapons: [
      { id: "cuspe", damage: 20, interval: 1.4, range: 105, targeting: { kind: "area", radius: 14 } },
    ],
  },
  bear: {
    id: "bear",
    name: "Urso",
    hp: 2400,
    armor: 5,
    speed: 26,
    weapons: [
      { id: "garras", damage: 52, interval: 0.8, range: 22, targeting: { kind: "foremost" } },
      { id: "patada", damage: 38, interval: 2.4, range: 26, targeting: { kind: "area", radius: 20 } },
    ],
  },
  minotaur: {
    id: "minotaur",
    name: "Minotauro",
    hp: 2600,
    armor: 7,
    speed: 19,
    weapons: [
      { id: "machadao", damage: 68, interval: 1.3, range: 28, targeting: { kind: "area", radius: 22 } },
      { id: "investida", damage: 30, interval: 3, range: 70, targeting: { kind: "lowestHp" } },
    ],
  },
  troll: {
    id: "troll",
    name: "Troll",
    hp: 2800,
    armor: 6,
    speed: 12,
    weapons: [
      { id: "clava", damage: 120, interval: 2.2, range: 32, targeting: { kind: "area", radius: 22 } },
    ],
  },
  "wood-tower": {
    id: "wood-tower",
    name: "Torre de Madeira",
    hp: 1900,
    armor: 6,
    speed: 0,
    weapons: [
      { id: "besteiros", damage: 17, interval: 0.7, range: 120, targeting: { kind: "foremost" } },
      { id: "oleo", damage: 26, interval: 2.6, range: 70, targeting: { kind: "area", radius: 22 } },
    ],
  },
  tower: {
    id: "tower",
    name: "Torre de Vigia",
    hp: 2800,
    armor: 9,
    speed: 0,
    weapons: [
      { id: "arqueiros", damage: 16, interval: 0.6, range: 150, targeting: { kind: "foremost" } },
      { id: "canhao", damage: 40, interval: 2, range: 170, targeting: { kind: "area", radius: 30 } },
    ],
  },
  "tower-blue": {
    id: "tower-blue",
    name: "Torre Azul",
    hp: 2500,
    armor: 11,
    speed: 0,
    weapons: [
      { id: "arqueiros", damage: 15, interval: 0.55, range: 160, targeting: { kind: "lowestHp" } },
      { id: "canhao", damage: 45, interval: 2.2, range: 180, targeting: { kind: "area", radius: 26 } },
    ],
  },
  "tower-purple": {
    id: "tower-purple",
    name: "Torre Sombria",
    hp: 2700,
    armor: 13,
    speed: 0,
    weapons: [
      { id: "arqueiros", damage: 15, interval: 0.5, range: 170, targeting: { kind: "foremost" } },
      { id: "canhao", damage: 48, interval: 2, range: 190, targeting: { kind: "area", radius: 28 } },
    ],
  },
  castle: {
    id: "castle",
    name: "Castelo",
    hp: 2600,
    armor: 14,
    speed: 0,
    weapons: [
      { id: "muralha", damage: 13, interval: 0.45, range: 190, targeting: { kind: "foremost" } },
      { id: "balista", damage: 42, interval: 1.8, range: 210, targeting: { kind: "lowestHp" } },
      { id: "canhoes", damage: 42, interval: 2.4, range: 200, targeting: { kind: "area", radius: 30 } },
    ],
  },
};

export function formById(id: string): DefenderForm {
  const form = FORMS[id];
  if (!form) throw new Error(`Forma desconhecida: ${id}`);
  return form;
}

/** Construções não andam — é o que separa prédio de criatura. */
export function isBuilding(form: DefenderForm): boolean {
  return form.speed === 0;
}
