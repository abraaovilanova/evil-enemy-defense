import { describe, expect, it } from "vitest";
import {
  applyDamage,
  createBattle,
  damageFractionOf,
  MAX_TICKS,
  runBattle,
  step,
  type ArmyEntry,
} from "./battle";
import { stageById, STAGES } from "../domain/stages";
import { ENTRY_X, TICK_SECONDS, type Side, type Stage } from "../domain/types";
import { coinBreakdown, coinsFor } from "../domain/rewards";

const goblin = stageById("goblin-camp");

function army(...entries: Array<Partial<ArmyEntry> & { typeId: string; count: number }>): ArmyEntry[] {
  return entries.map((entry) => ({
    level: 1,
    side: -1 as Side,
    ...entry,
  }));
}

/** Estágio de teste com uma Guarnição arbitrária. */
function stageWith(garrison: Stage["garrison"]): Stage {
  return { ...goblin, garrison };
}

describe("fim de Run", () => {
  it("vence quando a Guarnição inteira cai", () => {
    const result = runBattle(goblin, army({ typeId: "warrior", level: 6, count: 10 }));
    expect(result.outcome).toBe("victory");
    expect(result.damageFraction).toBe(1);
  });

  it("perde quando todas as Unidades morrem", () => {
    const result = runBattle(goblin, army({ typeId: "archer", count: 1 }));
    expect(result.outcome).toBe("defeat");
    expect(result.survivors).toBe(0);
  });

  it("matar parte da Guarnição não vence a Run", () => {
    const stage = stageWith([
      { formId: "goblin", x: 0 },
      { formId: "tower", x: 60 },
    ]);
    const state = createBattle(stage, army({ typeId: "warrior", level: 12, count: 14 }));
    let sawPartial = false;
    for (let i = 0; i < 1200 && state.outcome === "running"; i++) {
      step(state);
      if (state.defenders.length === 1) sawPartial = true;
      if (sawPartial && state.outcome === "running") break;
    }
    expect(sawPartial).toBe(true);
    expect(state.outcome).toBe("running");
  });

  it("não existe tempo-limite: a Run só termina por HP ou por Exército morto", () => {
    const result = runBattle(goblin, army({ typeId: "bomber", level: 3, count: 4 }));
    expect(result.outcome).toBe("victory");
    expect(result.ticks).toBeLessThan(MAX_TICKS);
  });
});

describe("Armadura", () => {
  it("subtrai um valor fixo de cada golpe", () => {
    // Guerreiro tem 3 de Armadura; a adaga do goblin bate 20 -> 17 por golpe.
    const state = createBattle(goblin, army({ typeId: "warrior", count: 1 }));
    const unit = state.units[0]!;
    while (unit.hp === unit.maxHp && state.outcome === "running") step(state);
    expect(unit.maxHp - unit.hp).toBe(17);
  });

  it("nunca deixa um golpe valer menos que 1", () => {
    // Dano 6 contra Armadura 16 ainda tira 1 — Armadura não dá imunidade.
    const target = { hp: 100, armor: 16 };
    applyDamage(target, 6);
    expect(target.hp).toBe(99);
  });
});

describe("Avanço e Guarnição", () => {
  it("a Unidade entra pela sua Entrada e caminha para o centro", () => {
    const state = createBattle(goblin, army({ typeId: "warrior", count: 1, side: 1 }));
    expect(state.units[0]!.x).toBeGreaterThanOrEqual(ENTRY_X);
    for (let i = 0; i < 40; i++) step(state);
    expect(state.units[0]!.x).toBeLessThan(ENTRY_X);
  });

  it("as duas Entradas convergem para o mesmo centro", () => {
    const state = createBattle(
      goblin,
      army(
        { typeId: "warrior", count: 2, side: -1 },
        { typeId: "warrior", count: 2, side: 1 },
      ),
    );
    const left = state.units.filter((u) => u.side === -1);
    const right = state.units.filter((u) => u.side === 1);
    expect(left.every((u) => u.x < 0)).toBe(true);
    expect(right.every((u) => u.x > 0)).toBe(true);
    for (let i = 0; i < 100 && state.outcome === "running"; i++) step(state);
    for (const unit of state.units) expect(Math.abs(unit.x)).toBeLessThan(ENTRY_X);
  });

  it("a Unidade nunca recua para caçar quem ficou para trás", () => {
    // Um goblin no centro e outro atrás da coluna da esquerda.
    const stage = stageWith([
      { formId: "goblin", x: 0 },
      { formId: "goblin", x: -160 },
    ]);
    const state = createBattle(stage, army({ typeId: "bomber", count: 1, side: -1 }));
    const unit = state.units[0]!;
    let furthestLeft = unit.x;
    for (let i = 0; i < 200 && state.outcome === "running"; i++) {
      step(state);
      const alive = state.units[0];
      if (!alive) break;
      expect(alive.x).toBeGreaterThanOrEqual(furthestLeft - 0.001);
      furthestLeft = Math.max(furthestLeft, alive.x);
    }
  });

  it("criatura caminha na direção da Unidade; construção não sai do lugar", () => {
    const stage = stageWith([
      { formId: "goblin", x: 0 },
      { formId: "tower", x: 30 },
    ]);
    const state = createBattle(stage, army({ typeId: "warrior", count: 1, side: -1 }));
    const creature = state.defenders[0]!;
    const building = state.defenders[1]!;
    const creatureStart = creature.x;
    for (let i = 0; i < 20; i++) step(state);
    expect(creature.x).toBeLessThan(creatureStart);
    expect(building.x).toBe(30);
  });
});

describe("Regras de Alvo", () => {
  const withWeapon = (targeting: Stage["garrison"] extends unknown ? never : never) => targeting;
  void withWeapon;

  it("'foremost' acerta quem está mais perto daquele Defensor", () => {
    const state = createBattle(goblin, army({ typeId: "warrior", count: 3 }));
    // Todas as Unidades da esquerda: a de menor |x - 0| é a mais avançada.
    for (let i = 0; i < 200 && state.outcome === "running"; i++) {
      step(state);
      const wounded = state.units.filter((u) => u.hp < u.maxHp);
      if (wounded.length > 0) {
        const nearest = state.units.reduce((a, b) => (Math.abs(a.x) <= Math.abs(b.x) ? a : b));
        expect(wounded[0]!.id).toBe(nearest.id);
        return;
      }
    }
  });

  it("dano em área acerta mais de uma Unidade de uma vez", () => {
    const stage = stageWith([{ formId: "troll", x: 0 }]);
    const state = createBattle(stage, army({ typeId: "warrior", level: 8, count: 6 }));
    for (let i = 0; i < 600 && state.outcome === "running"; i++) {
      step(state);
      if (state.units.filter((u) => u.hp < u.maxHp).length > 1) return;
    }
    throw new Error("a clava do troll nunca acertou duas Unidades juntas");
  });
});

describe("determinismo", () => {
  it("a mesma Run produz exatamente o mesmo resultado", () => {
    const composition = army(
      { typeId: "warrior", level: 3, count: 4, side: -1 },
      { typeId: "archer", level: 2, count: 3, side: 1 },
      { typeId: "bomber", level: 1, count: 1, side: -1 },
    );
    const stage = stageById("wood-outpost");
    expect(runBattle(stage, composition)).toEqual(runBattle(stage, composition));
  });
});

describe("Moedas", () => {
  it("o total é a soma das quatro parcelas", () => {
    const result = runBattle(goblin, army({ typeId: "warrior", level: 6, count: 10 }));
    const b = coinBreakdown(goblin, result, false);
    expect(b.total).toBe(b.damage + b.time + b.survivors + b.victory);
  });

  it("vencer rápido paga mais que vencer devagar", () => {
    const win = (ticks: number) =>
      ({ outcome: "victory", ticks, damageFraction: 1, survivors: 3, initialUnits: 6 }) as const;
    expect(coinBreakdown(goblin, win(200), true).time).toBeGreaterThan(
      coinBreakdown(goblin, win(900), true).time,
    );
  });

  it("perder devagar paga mais que perder rápido", () => {
    const quick = { outcome: "defeat", ticks: 40, damageFraction: 0.1, survivors: 0, initialUnits: 5 } as const;
    const long = { outcome: "defeat", ticks: 600, damageFraction: 0.1, survivors: 0, initialUnits: 5 } as const;
    expect(coinBreakdown(goblin, long, false).time).toBeGreaterThan(
      coinBreakdown(goblin, quick, false).time,
    );
  });

  it("a Primeira Vitória paga o bônus uma vez só", () => {
    const result = runBattle(goblin, army({ typeId: "warrior", level: 6, count: 10 }));
    expect(coinsFor(goblin, result, false)).toBeGreaterThan(coinsFor(goblin, result, true));
  });

  it("o contador ao vivo nunca conta a vitória antes da hora", () => {
    const state = createBattle(goblin, army({ typeId: "warrior", level: 6, count: 8 }));
    for (let i = 0; i < 30; i++) step(state);
    const live = coinBreakdown(
      goblin,
      { outcome: "defeat", ticks: state.ticks, damageFraction: damageFractionOf(state), survivors: state.units.length, initialUnits: state.initialUnits },
      false,
      true,
    );
    expect(live.victory).toBe(0);
    expect(live.total).toBeGreaterThan(0);
  });
});

describe("balanceamento da escada", () => {
  const starting = () => army({ typeId: "warrior", count: 6, side: -1 });

  it("o Estágio 1 é vencível com o Exército inicial — se ele for concentrado", () => {
    // A primeira Run ensina a mecânica das Entradas: os mesmos 6 guerreiros
    // vencem juntos e perdem divididos, porque o goblin só encara um lado.
    const together = runBattle(STAGES[0]!, starting());
    expect(together.outcome).toBe("victory");
    expect(together.survivors).toBeLessThanOrEqual(3);

    const split = runBattle(
      STAGES[0]!,
      army(
        { typeId: "warrior", count: 3, side: -1 },
        { typeId: "warrior", count: 3, side: 1 },
      ),
    );
    expect(split.outcome).toBe("defeat");
  });

  it("do Estágio 2 em diante o Exército inicial não passa", () => {
    for (const stage of STAGES.slice(1)) {
      expect(runBattle(stage, starting()).outcome, stage.name).toBe("defeat");
    }
  });

  it("uma Run vencida dura entre 4 e 90 segundos", () => {
    const strong = (level: number, count: number) =>
      army(
        { typeId: "warrior", level, count, side: -1 },
        { typeId: "warrior", level, count, side: 1 },
        { typeId: "archer", level, count, side: -1 },
        { typeId: "bomber", level, count: Math.ceil(count / 2), side: 1 },
      );
    for (const stage of STAGES) {
      const result = runBattle(stage, strong(20, 12));
      expect(result.outcome, stage.name).toBe("victory");
      const seconds = result.ticks * TICK_SECONDS;
      expect(seconds, stage.name).toBeGreaterThan(4);
      expect(seconds, stage.name).toBeLessThan(90);
    }
  });
});
