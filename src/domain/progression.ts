import { STAGES } from "./stages";
import { UNIT_TYPES, unitTypeById } from "./unitTypes";
import type { UnitTypeId } from "./types";

/** Meta-progressão: tudo que sobrevive entre Runs. */
export interface PlayerState {
  coins: number;
  /** Tipos desbloqueados e seus níveis. Ausente = não desbloqueado. */
  levels: Partial<Record<UnitTypeId, number>>;
  /** Quantas Unidades cabem no Exército. */
  capacity: number;
  /** Ids de Estágios já vencidos (para a regra de Primeira Vitória). */
  cleared: string[];
}

export const STARTING_CAPACITY = 6;
export const MAX_LEVEL = 20;
export const MAX_CAPACITY = 40;

export function initialPlayer(): PlayerState {
  return {
    coins: 0,
    levels: { warrior: 1 },
    capacity: STARTING_CAPACITY,
    cleared: [],
  };
}

export function levelUpCost(currentLevel: number): number {
  return Math.round(30 * Math.pow(1.48, currentLevel - 1));
}

export function capacityCost(currentCapacity: number): number {
  return Math.round(
    50 * Math.pow(1.15, currentCapacity - STARTING_CAPACITY),
  );
}

export function isUnlocked(player: PlayerState, typeId: UnitTypeId): boolean {
  return player.levels[typeId] !== undefined;
}

export function levelOf(player: PlayerState, typeId: UnitTypeId): number {
  const level = player.levels[typeId];
  if (level === undefined) {
    throw new Error(`Tipo não desbloqueado: ${typeId}`);
  }
  return level;
}

/**
 * As compras retornam um novo PlayerState, ou `null` quando a compra é
 * inválida (sem Moedas, no teto, já desbloqueado). A UI usa `null` para
 * desabilitar o item de menu.
 */
export function buyLevel(
  player: PlayerState,
  typeId: UnitTypeId,
): PlayerState | null {
  const level = player.levels[typeId];
  if (level === undefined || level >= MAX_LEVEL) return null;
  const cost = levelUpCost(level);
  if (player.coins < cost) return null;
  return {
    ...player,
    coins: player.coins - cost,
    levels: { ...player.levels, [typeId]: level + 1 },
  };
}

/**
 * Um Tipo só aparece na loja depois do Estágio que o libera (Q4) — seis opções
 * de cara seriam um muro de escolhas sem informação para decidir.
 */
export function isTypeAvailable(
  player: PlayerState,
  typeId: UnitTypeId,
): boolean {
  const gate = unitTypeById(typeId).unlockedByStage;
  return gate === undefined || hasCleared(player, gate);
}

export function buyUnlock(
  player: PlayerState,
  typeId: UnitTypeId,
): PlayerState | null {
  if (isUnlocked(player, typeId) || !isTypeAvailable(player, typeId)) return null;
  const cost = unitTypeById(typeId).unlockCost;
  if (player.coins < cost) return null;
  return {
    ...player,
    coins: player.coins - cost,
    levels: { ...player.levels, [typeId]: 1 },
  };
}

export function buyCapacity(player: PlayerState): PlayerState | null {
  if (player.capacity >= MAX_CAPACITY) return null;
  const cost = capacityCost(player.capacity);
  if (player.coins < cost) return null;
  return { ...player, coins: player.coins - cost, capacity: player.capacity + 1 };
}

/** O Estágio 1 está sempre aberto; os demais pedem o anterior vencido. */
export function isStageUnlocked(player: PlayerState, stageId: string): boolean {
  const index = STAGES.findIndex((s) => s.id === stageId);
  if (index <= 0) return index === 0;
  return player.cleared.includes(STAGES[index - 1]!.id);
}

export function hasCleared(player: PlayerState, stageId: string): boolean {
  return player.cleared.includes(stageId);
}

/** Aplica o resultado de uma Run: credita Moedas e marca a Primeira Vitória. */
export function afterRun(
  player: PlayerState,
  stageId: string,
  coins: number,
  won: boolean,
): PlayerState {
  return {
    ...player,
    coins: player.coins + coins,
    cleared: won && !hasCleared(player, stageId)
      ? [...player.cleared, stageId]
      : player.cleared,
  };
}

/** Todos os tipos, na ordem em que aparecem na loja. */
export function allUnitTypeIds(): UnitTypeId[] {
  return Object.keys(UNIT_TYPES);
}
