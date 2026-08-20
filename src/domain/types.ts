/**
 * Vocabulário definido em CONTEXT.md. Nada aqui sabe desenhar.
 *
 * Eixo do campo: a construção principal da Guarnição fica em x = 0, e as duas
 * Entradas do Exército ficam em -ENTRY_X e +ENTRY_X (ADR 0004).
 */

/** Distância da Entrada até o centro do campo, em unidades de domínio. */
export const ENTRY_X = 175;

/** Passo fixo da simulação (ADR 0001): 20 ticks por segundo. */
export const TICK_SECONDS = 1 / 20;

/** Lado por onde uma parte do Exército entra. -1 = esquerda, +1 = direita. */
export type Side = -1 | 1;

export type UnitTypeId = string;

/** Tipo de Unidade — uma classe de atacante. Ver CONTEXT.md. */
export interface UnitType {
  id: UnitTypeId;
  name: string;
  /** Abreviação de 3 letras, para o contador do HUD. */
  short: string;
  /** HP no nível 1. */
  hp: number;
  /** Dano por ataque no nível 1. */
  damage: number;
  /** Redução fixa de dano por golpe recebido. */
  armor: number;
  /** Segundos entre ataques. */
  attackInterval: number;
  /** Distância de um Defensor a partir da qual consegue atacá-lo. */
  range: number;
  /** Unidades de domínio por segundo, durante o Avanço. */
  speed: number;
  /** Moedas para desbloquear. 0 = já vem desbloqueado. */
  unlockCost: number;
  /** Só aparece na loja depois deste Estágio ser vencido. */
  unlockedByStage?: string;
}

/** Como uma Arma escolhe quem atingir, entre as Unidades no seu alcance. */
export type TargetingRule =
  /** A Unidade mais próxima deste Defensor. */
  | { kind: "foremost" }
  /** A Unidade com menos HP atual. */
  | { kind: "lowestHp" }
  /** Todas as Unidades a `radius` da mais próxima. */
  | { kind: "area"; radius: number };

/** Arma — um sistema de ataque de um Defensor. */
export interface Weapon {
  id: string;
  damage: number;
  /** Segundos entre disparos. */
  interval: number;
  /** Só atinge Unidades a esta distância ou menos do Defensor. */
  range: number;
  targeting: TargetingRule;
}

/** Forma — o que um Defensor é: criatura ou construção. */
export interface DefenderForm {
  id: string;
  name: string;
  hp: number;
  armor: number;
  /**
   * Unidades de domínio por segundo. 0 = construção, nunca sai do lugar.
   * Criaturas caminham na direção da Unidade viva mais próxima quando não têm
   * ninguém no alcance.
   */
  speed: number;
  weapons: Weapon[];
}

/** Um membro da Guarnição: uma Forma numa posição do campo. */
export interface GarrisonSlot {
  formId: string;
  /** Posição no eixo do campo. 0 = centro. */
  x: number;
}

/** Estágio — um encontro fixo com uma Guarnição. */
export interface Stage {
  id: string;
  name: string;
  garrison: GarrisonSlot[];
  /** Base de todas as parcelas de Moeda da Run. */
  baseReward: number;
  /** Moedas extras na Primeira Vitória. */
  firstClearBonus: number;
}
