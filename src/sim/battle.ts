import {
  ENTRY_X,
  TICK_SECONDS,
  type Side,
  type Stage,
  type Weapon,
} from "../domain/types";
import { formById } from "../domain/forms";
import { damageAtLevel, hpAtLevel, unitTypeById } from "../domain/unitTypes";

/** Uma parcela do Exército: tipo, nível, quantidade e por qual Entrada entra. */
export interface ArmyEntry {
  typeId: string;
  level: number;
  count: number;
  side: Side;
}

/** Uma Unidade viva dentro da simulação. */
export interface SimUnit {
  id: number;
  typeId: string;
  side: Side;
  /** Posição no eixo do campo. O centro da Guarnição é 0. */
  x: number;
  hp: number;
  maxHp: number;
  damage: number;
  armor: number;
  range: number;
  speed: number;
  attackInterval: number;
  cooldown: number;
  /** Preenchido pelo tick: o Defensor que ela está atacando agora. */
  targetId: number | null;
}

/** Um Defensor vivo dentro da simulação. */
export interface SimDefender {
  id: number;
  formId: string;
  x: number;
  hp: number;
  maxHp: number;
  armor: number;
  speed: number;
  weapons: Weapon[];
  /** Segundos até o próximo disparo, por Arma. */
  cooldowns: number[];
  /** Preenchido pelo tick: true se atacou alguém neste tick. */
  firing: boolean;
}

export interface BattleState {
  stage: Stage;
  units: SimUnit[];
  defenders: SimDefender[];
  /** HP total da Guarnição no início, para medir o dano causado. */
  garrisonMaxHp: number;
  /** Quantas Unidades entraram em campo. */
  initialUnits: number;
  ticks: number;
  outcome: "running" | "victory" | "defeat";
}

/** Espaçamento entre Unidades na largada, para não nascerem empilhadas. */
const SPAWN_GAP = 5;

/** Trava de segurança: 10 minutos simulados. */
export const MAX_TICKS = Math.round((10 * 60) / TICK_SECONDS);

export function createBattle(stage: Stage, army: ArmyEntry[]): BattleState {
  const units: SimUnit[] = [];
  let index = 0;
  /** Quantas Unidades já nasceram em cada Entrada, para escalonar a coluna. */
  const perSide = new Map<Side, number>([
    [-1, 0],
    [1, 0],
  ]);

  for (const entry of army) {
    const type = unitTypeById(entry.typeId);
    for (let n = 0; n < entry.count; n++) {
      const rank = perSide.get(entry.side) ?? 0;
      perSide.set(entry.side, rank + 1);
      const maxHp = hpAtLevel(type, entry.level);
      units.push({
        id: index++,
        typeId: type.id,
        side: entry.side,
        // Quem entra depois nasce mais para fora, formando uma coluna.
        x: entry.side * (ENTRY_X + rank * SPAWN_GAP),
        hp: maxHp,
        maxHp,
        damage: damageAtLevel(type, entry.level),
        armor: type.armor,
        range: type.range,
        speed: type.speed,
        attackInterval: type.attackInterval,
        cooldown: 0,
        targetId: null,
      });
    }
  }

  const defenders: SimDefender[] = stage.garrison.map((slot, i) => {
    const form = formById(slot.formId);
    return {
      id: i,
      formId: form.id,
      x: slot.x,
      hp: form.hp,
      maxHp: form.hp,
      armor: form.armor,
      speed: form.speed,
      weapons: form.weapons,
      cooldowns: form.weapons.map(() => 0),
      firing: false,
    };
  });

  return {
    stage,
    units,
    defenders,
    garrisonMaxHp: defenders.reduce((total, d) => total + d.maxHp, 0),
    initialUnits: units.length,
    ticks: 0,
    outcome: "running",
  };
}

/** Dano recebido, já descontada a Armadura. Nunca menos de 1 (ADR 0004). */
export function applyDamage(target: { hp: number; armor: number }, amount: number): void {
  target.hp -= Math.max(1, amount - target.armor);
}

/**
 * Menor por `score`, empate resolvido pelo menor `id` — a simulação precisa ser
 * determinística (ADR 0001), então nada de ordem indefinida.
 */
function minBy<T extends { id: number }>(items: T[], score: (item: T) => number): T {
  let best = items[0]!;
  for (const item of items) {
    const diff = score(item) - score(best);
    if (diff < 0 || (diff === 0 && item.id < best.id)) best = item;
  }
  return best;
}

/** Alvos que uma Arma atinge neste disparo. Vazio = não há ninguém em alcance. */
function pickTargets(
  weapon: Weapon,
  defenderX: number,
  units: SimUnit[],
): SimUnit[] {
  const inRange = units.filter((u) => Math.abs(u.x - defenderX) <= weapon.range);
  if (inRange.length === 0) return [];

  switch (weapon.targeting.kind) {
    case "foremost":
      return [minBy(inRange, (u) => Math.abs(u.x - defenderX))];
    case "lowestHp":
      return [minBy(inRange, (u) => u.hp)];
    case "area": {
      const epicentre = minBy(inRange, (u) => Math.abs(u.x - defenderX));
      const radius = weapon.targeting.radius;
      return inRange.filter((u) => Math.abs(u.x - epicentre.x) <= radius);
    }
  }
}

/** Avança a simulação em um tick fixo. Sem efeitos colaterais externos. */
export function step(state: BattleState): void {
  if (state.outcome !== "running") return;
  const dt = TICK_SECONDS;

  // 1. Os Defensores atiram, ou caminham se ninguém está no alcance.
  for (const defender of state.defenders) {
    defender.firing = false;
    let fired = false;

    defender.weapons.forEach((weapon, i) => {
      defender.cooldowns[i] = (defender.cooldowns[i] ?? 0) - dt;
      while ((defender.cooldowns[i] ?? 0) <= 0) {
        const targets = pickTargets(weapon, defender.x, state.units);
        if (targets.length === 0) {
          // Sem alvo: a Arma fica pronta, sem acumular disparos.
          defender.cooldowns[i] = 0;
          break;
        }
        for (const target of targets) applyDamage(target, weapon.damage);
        fired = true;
        defender.cooldowns[i] = (defender.cooldowns[i] ?? 0) + weapon.interval;
      }
    });
    defender.firing = fired;

    // Criatura sem ninguém em alcance de nenhuma Arma caminha para a Unidade
    // viva mais próxima. Construção (speed 0) nunca sai do lugar.
    const longestRange = Math.max(...defender.weapons.map((w) => w.range));
    const anyoneClose = state.units.some(
      (u) => Math.abs(u.x - defender.x) <= longestRange,
    );
    if (defender.speed > 0 && !anyoneClose && state.units.length > 0) {
      const prey = minBy(state.units, (u) => Math.abs(u.x - defender.x));
      const direction = Math.sign(prey.x - defender.x);
      defender.x += direction * defender.speed * dt;
    }
  }

  state.units = state.units.filter((u) => u.hp > 0);

  // 2. As Unidades atacam quem está no Alcance, ou avançam.
  for (const unit of state.units) {
    const reachable = state.defenders.filter(
      (d) => Math.abs(d.x - unit.x) <= unit.range,
    );

    if (reachable.length > 0) {
      // Para de avançar e resolve quem está em cima — de qualquer lado (Q16).
      const target = minBy(reachable, (d) => Math.abs(d.x - unit.x));
      unit.targetId = target.id;
      unit.cooldown -= dt;
      while (unit.cooldown <= 0) {
        applyDamage(target, unit.damage);
        unit.cooldown += unit.attackInterval;
      }
      continue;
    }

    unit.targetId = null;
    if (state.defenders.length === 0) continue;

    // Avança rumo ao centro. Só encara o que ficou para trás quando não há mais
    // nada à frente — a coluna nunca oscila entre duas ameaças (Q16/ADR 0004).
    const forward = -unit.side;
    const ahead = state.defenders.filter(
      (d) => Math.sign(d.x - unit.x) === forward || d.x === unit.x,
    );
    const goal = ahead.length > 0 ? minBy(ahead, (d) => Math.abs(d.x - unit.x)) : minBy(state.defenders, (d) => Math.abs(d.x - unit.x));

    const gap = Math.abs(goal.x - unit.x) - unit.range;
    const stepSize = Math.min(unit.speed * dt, Math.max(0, gap));
    unit.x += Math.sign(goal.x - unit.x) * stepSize;
  }

  state.defenders = state.defenders.filter((d) => d.hp > 0);
  state.ticks++;

  // 3. Fim de Run.
  if (state.defenders.length === 0) {
    state.outcome = "victory";
  } else if (state.units.length === 0) {
    state.outcome = "defeat";
  } else if (state.ticks >= MAX_TICKS) {
    state.outcome = "defeat";
  }
}

/** Dano causado à Guarnição, de 0 a 1. */
export function damageFractionOf(state: BattleState): number {
  const remaining = state.defenders.reduce((total, d) => total + Math.max(0, d.hp), 0);
  return (state.garrisonMaxHp - remaining) / state.garrisonMaxHp;
}

export interface BattleResult {
  outcome: "victory" | "defeat";
  ticks: number;
  /** Fração do HP da Guarnição destruída, de 0 a 1. */
  damageFraction: number;
  survivors: number;
  initialUnits: number;
}

export function resultOf(state: BattleState): BattleResult {
  return {
    outcome: state.outcome === "victory" ? "victory" : "defeat",
    ticks: state.ticks,
    damageFraction: damageFractionOf(state),
    survivors: state.units.length,
    initialUnits: state.initialUnits,
  };
}

/** Roda a Run inteira de uma vez. É o que os testes de balanceamento usam. */
export function runBattle(stage: Stage, army: ArmyEntry[]): BattleResult {
  const state = createBattle(stage, army);
  while (state.outcome === "running") step(state);
  return resultOf(state);
}
