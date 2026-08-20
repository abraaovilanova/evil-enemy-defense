import { describe, expect, it } from "vitest";
import {
  afterRun,
  allUnitTypeIds,
  buyCapacity,
  buyLevel,
  buyUnlock,
  capacityCost,
  hasCleared,
  initialPlayer,
  isStageUnlocked,
  isUnlocked,
  levelOf,
  levelUpCost,
  type PlayerState,
} from "./progression";
import { STAGES } from "./stages";
import { unitTypeById } from "./unitTypes";
import { coinsFor } from "./rewards";
import { runBattle, type ArmyEntry } from "../sim/battle";

describe("compras", () => {
  it("recusa a compra quando faltam Moedas", () => {
    expect(buyLevel(initialPlayer(), "warrior")).toBeNull();
    expect(buyCapacity(initialPlayer())).toBeNull();
    expect(buyUnlock(initialPlayer(), "archer")).toBeNull();
  });

  it("desbloquear um tipo o entrega no nível 1 e cobra o custo", () => {
    const rich: PlayerState = { ...initialPlayer(), coins: 1000 };
    const next = buyUnlock(rich, "archer")!;
    expect(levelOf(next, "archer")).toBe(1);
    expect(next.coins).toBe(1000 - unitTypeById("archer").unlockCost);
  });

  it("não desbloqueia duas vezes", () => {
    const rich: PlayerState = { ...initialPlayer(), coins: 1000 };
    expect(buyUnlock(rich, "warrior")).toBeNull();
  });

  it("upgrades ficam mais caros a cada compra", () => {
    expect(levelUpCost(2)).toBeGreaterThan(levelUpCost(1));
    expect(capacityCost(10)).toBeGreaterThan(capacityCost(6));
  });

  it("compras não mutam o estado anterior", () => {
    const rich: PlayerState = { ...initialPlayer(), coins: 1000 };
    buyLevel(rich, "warrior");
    expect(rich.coins).toBe(1000);
    expect(levelOf(rich, "warrior")).toBe(1);
  });
});

describe("abertura de Estágios", () => {
  it("o primeiro Estágio já começa aberto e os outros não", () => {
    const player = initialPlayer();
    expect(isStageUnlocked(player, STAGES[0]!.id)).toBe(true);
    expect(isStageUnlocked(player, STAGES[1]!.id)).toBe(false);
  });

  it("vencer um Estágio abre o próximo; perder não", () => {
    let player = initialPlayer();
    player = afterRun(player, STAGES[0]!.id, 10, false);
    expect(isStageUnlocked(player, STAGES[1]!.id)).toBe(false);
    player = afterRun(player, STAGES[0]!.id, 60, true);
    expect(isStageUnlocked(player, STAGES[1]!.id)).toBe(true);
    expect(player.coins).toBe(70);
  });

  it("a Primeira Vitória só conta uma vez", () => {
    let player = afterRun(initialPlayer(), STAGES[0]!.id, 60, true);
    player = afterRun(player, STAGES[0]!.id, 10, true);
    expect(player.cleared.filter((id) => id === STAGES[0]!.id)).toHaveLength(1);
    expect(hasCleared(player, STAGES[0]!.id)).toBe(true);
  });
});

/**
 * Teste de economia: um jogador ganancioso e burro (divide a Capacidade em
 * partes iguais, compra sempre o upgrade mais barato) tem que conseguir
 * terminar os três Estágios. Se este teste quebrar depois de mexer nos
 * números, o loop de Moedas parou de fechar.
 */
describe("o loop de Moedas fecha", () => {
  /**
   * Um jogador comum: metade da Capacidade em linha de frente, o resto no que
   * tiver de alcance, dividido entre as duas Entradas. Não é jogo ótimo — é o
   * suficiente para medir se o dinheiro que entra sustenta a escada.
   */
  function greedyArmy(player: PlayerState): ArmyEntry[] {
    const unlocked = allUnitTypeIds().filter((id) => isUnlocked(player, id));
    const front = unlocked.filter((id) => ["warrior", "lancer"].includes(id));
    const back = unlocked.filter((id) => ["bomber", "archer"].includes(id));
    const army: ArmyEntry[] = [];
    let left = player.capacity;

    const take = (ids: string[], share: number) => {
      if (ids.length === 0) return;
      const each = Math.max(1, Math.floor((player.capacity * share) / ids.length));
      for (const id of ids) {
        const count = Math.min(each, left);
        if (count <= 0) return;
        left -= count;
        const half = Math.ceil(count / 2);
        army.push({ typeId: id, level: levelOf(player, id), count: half, side: -1 });
        army.push({ typeId: id, level: levelOf(player, id), count: count - half, side: 1 });
      }
    };

    take(front, 0.6);
    take(back, 0.4);
    if (left > 0 && army[0]) army[0].count += left;
    return army.filter((entry) => entry.count > 0);
  }

  function cheapestPurchase(player: PlayerState): PlayerState | null {
    const options: Array<[number, PlayerState | null]> = [];
    for (const id of allUnitTypeIds()) {
      options.push(
        isUnlocked(player, id)
          ? [levelUpCost(levelOf(player, id)), buyLevel(player, id)]
          : [unitTypeById(id).unlockCost, buyUnlock(player, id)],
      );
    }
    options.push([capacityCost(player.capacity), buyCapacity(player)]);
    const affordable = options
      .filter(([, next]) => next !== null)
      .sort((a, b) => a[0] - b[0]);
    return affordable[0]?.[1] ?? null;
  }

  it("um jogador ganancioso chega ao Estágio 10 num número razoável de Runs", () => {
    // Os dois últimos Estágios são muro de composição, não de grind: nem o
    // Exército no teto vence com uma divisão ingênua. Isso é testado à parte.
    const target = STAGES[9]!;
    let player = initialPlayer();
    let runs = 0;
    const MAX_RUNS = 220;

    while (!hasCleared(player, target.id) && runs < MAX_RUNS) {
      // Como um jogador de verdade: tenta o Estágio novo de vez em quando e,
      // no resto do tempo, farma o melhor Estágio que já sabe vencer.
      const frontier =
        [...STAGES].reverse().find((s) => isStageUnlocked(player, s.id)) ??
        STAGES[0]!;
      const farm =
        [...STAGES].reverse().find((s) => hasCleared(player, s.id)) ?? frontier;
      const attempt = runs % 4 === 0 ? frontier : farm;
      const result = runBattle(attempt, greedyArmy(player));
      const coins = coinsFor(attempt, result, hasCleared(player, attempt.id));
      player = afterRun(player, attempt.id, coins, result.outcome === "victory");
      runs++;

      // Gasta tudo que puder antes da próxima Run.
      for (;;) {
        const next = cheapestPurchase(player);
        if (!next) break;
        player = next;
      }
    }

    expect(runs, `Runs até zerar: ${runs}`).toBeLessThan(MAX_RUNS);
    // Se cair para pouquíssimas Runs, a progressão virou passeio.
    expect(runs).toBeGreaterThan(4);
  });
});
