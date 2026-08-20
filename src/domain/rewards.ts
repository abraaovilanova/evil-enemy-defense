import { TICK_SECONDS, type Stage } from "./types";
import type { BattleResult } from "../sim/battle";

/**
 * Moedas de uma Run = dano + tempo + sobreviventes + vitória (Q1).
 *
 * Todas as parcelas são frações da recompensa base do Estágio, então dá para
 * mostrar o total parcial no HUD *durante* a Run e o número não muda de
 * significado no fim. A parcela de tempo troca de sinal conforme o desfecho:
 * vencer rápido paga mais, perder devagar paga mais (Q7).
 */

/** Dano: fração da base equivalente a destruir a Guarnição inteira. */
export const DAMAGE_RATE = 1;

/** Rapidez: bônus máximo na vitória, que decai até zerar em SPEED_LIMIT. */
export const SPEED_RATE = 0.5;
export const SPEED_LIMIT_SECONDS = 60;

/** Resistência: quanto a derrota paga por segundo sobrevivido, com teto. */
export const TIME_RATE = 0.006;
export const TIME_CAP = 0.35;

/** Sobreviventes: fração da base se o Exército inteiro voltar vivo. */
export const SURVIVOR_RATE = 0.3;

/** Vitória: prêmio por limpar a Guarnição, além das parcelas acima. */
export const VICTORY_RATE = 0.5;

export interface CoinBreakdown {
  damage: number;
  time: number;
  survivors: number;
  victory: number;
  total: number;
}

/**
 * Detalha as Moedas de um resultado. Serve tanto para o fim da Run quanto para
 * o contador ao vivo — no meio da Run, `outcome` ainda não é vitória, então só
 * as parcelas já garantidas aparecem.
 */
export function coinBreakdown(
  stage: Stage,
  result: BattleResult,
  alreadyCleared: boolean,
  live = false,
): CoinBreakdown {
  const base = stage.baseReward;
  const seconds = result.ticks * TICK_SECONDS;
  const won = result.outcome === "victory" && !live;

  const damage = Math.round(base * DAMAGE_RATE * result.damageFraction);

  const time = won
    ? Math.round(
        base * SPEED_RATE * Math.max(0, 1 - seconds / SPEED_LIMIT_SECONDS),
      )
    : Math.round(base * Math.min(TIME_CAP, TIME_RATE * seconds));

  const survivorFraction =
    result.initialUnits === 0 ? 0 : result.survivors / result.initialUnits;
  const survivors = Math.round(base * SURVIVOR_RATE * survivorFraction);

  const victory = won
    ? Math.round(base * VICTORY_RATE) + (alreadyCleared ? 0 : stage.firstClearBonus)
    : 0;

  return {
    damage,
    time,
    survivors,
    victory,
    total: damage + time + survivors + victory,
  };
}

/** Moedas ganhas por uma Run. */
export function coinsFor(
  stage: Stage,
  result: BattleResult,
  alreadyCleared: boolean,
): number {
  return coinBreakdown(stage, result, alreadyCleared).total;
}
