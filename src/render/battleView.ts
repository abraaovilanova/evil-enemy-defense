import type { BattleState, SimDefender, SimUnit } from "../sim/battle";
import { ENTRY_X } from "../domain/types";
import { formById, isBuilding } from "../domain/forms";
import { unitTypeById } from "../domain/unitTypes";
import { drawBox, drawText, PALETTE } from "./palette";
import { drawAnim, FORM_ANIMS, UNIT_ANIMS } from "./sprites";

export const VIEW_WIDTH = 320;
export const VIEW_HEIGHT = 180;

/** O centro da Guarnição (x = 0) fica no meio da tela. */
const CENTRE_SCREEN_X = VIEW_WIDTH / 2;
/** Cabe um pouco além da Entrada, para a coluna aparecer inteira ao nascer. */
const VISIBLE_HALF = ENTRY_X + 30;
const SCALE = VIEW_WIDTH / (VISIBLE_HALF * 2);
const GROUND_Y = 148;

/** Cor do retângulo de fallback, quando o sprite não carregou. */
const UNIT_COLOR: Record<string, string> = {
  warrior: PALETTE.unit,
  archer: PALETTE.unitRanged,
  bomber: PALETTE.unitSiege,
  pawn: "#c8d8f0",
  lancer: "#a0c0ff",
  thief: "#d0a0d0",
};

/** Altura do sprite na tela, em pixels do canvas de 320x180. */
const UNIT_HEIGHT = 26;
const FORM_HEIGHT: Record<string, number> = {
  goblin: 30,
  "great-orc": 38,
  lizard: 34,
  bear: 42,
  minotaur: 50,
  troll: 60,
  "wood-tower": 54,
  tower: 62,
  "tower-blue": 66,
  "tower-purple": 70,
  castle: 80,
};

function screenX(fieldX: number): number {
  return Math.round(CENTRE_SCREEN_X + fieldX * SCALE);
}

/**
 * Espalha as Unidades em profundidade para elas não virarem uma coluna de um
 * pixel. Derivado do id, então é estável entre frames (nada de aleatório).
 */
function laneOffset(id: number): number {
  return (id % 5) * 4 - 8;
}

/**
 * Desenha um frame da batalha. O renderer não altera o estado — ele só lê,
 * e guarda por conta própria o HP anterior para piscar quem levou dano.
 */
export class BattleView {
  private previousHp = new Map<number, number>();
  private flashUntil = new Map<number, number>();
  private previousDefenderHp = new Map<number, number>();
  private defenderFlash = new Map<number, number>();
  /**
   * Até quando cada Defensor continua mostrando a animação de ataque.
   * `firing` só é verdadeiro no tick do disparo (1 em 14, para uma Arma de
   * 0,7s), então usá-lo direto faz o sprite piscar entre idle e ataque. O
   * disparo agora *segura* a animação pela duração dela inteira.
   */
  private attackUntil = new Map<number, number>();
  /** Instante em que a animação de ataque atual começou. */
  private attackStarted = new Map<number, number>();

  draw(ctx: CanvasRenderingContext2D, state: BattleState, now: number): void {
    this.trackHits(state, now);

    ctx.fillStyle = PALETTE.sky;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.fillStyle = PALETTE.ground;
    ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, VIEW_HEIGHT - GROUND_Y);
    ctx.fillStyle = PALETTE.groundDark;
    ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, 2);

    // Guarnição do maior para o menor, para o castelo não cobrir as criaturas
    // que estão na frente dele.
    const defenders = [...state.defenders].sort(
      (a, b) => (FORM_HEIGHT[b.formId] ?? 40) - (FORM_HEIGHT[a.formId] ?? 40),
    );
    for (const defender of defenders) this.drawDefender(ctx, defender, state, now);

    const ordered = [...state.units].sort(
      (a, b) => laneOffset(a.id) - laneOffset(b.id),
    );
    for (const unit of ordered) this.drawUnit(ctx, unit, now);

    this.drawHud(ctx, state);
  }

  private trackHits(state: BattleState, now: number): void {
    const FLASH_MS = 140;
    for (const unit of state.units) {
      const before = this.previousHp.get(unit.id);
      if (before !== undefined && unit.hp < before) {
        this.flashUntil.set(unit.id, now + FLASH_MS);
      }
      this.previousHp.set(unit.id, unit.hp);
    }
    for (const defender of state.defenders) {
      const before = this.previousDefenderHp.get(defender.id);
      if (before !== undefined && defender.hp < before) {
        this.defenderFlash.set(defender.id, now + FLASH_MS);
      }
      this.previousDefenderHp.set(defender.id, defender.hp);
    }
  }

  private drawDefender(
    ctx: CanvasRenderingContext2D,
    defender: SimDefender,
    state: BattleState,
    now: number,
  ): void {
    const height = FORM_HEIGHT[defender.formId] ?? 40;
    const centre = screenX(defender.x);
    const hit = now < (this.defenderFlash.get(defender.id) ?? 0);
    const anims = FORM_ANIMS[defender.formId];
    if (defender.firing && anims) {
      const duration = (anims.attack.frames / anims.attack.fps) * 1000;
      this.attackUntil.set(defender.id, now + duration);
      this.attackStarted.set(defender.id, now);
    }
    const attacking = now < (this.attackUntil.get(defender.id) ?? 0);
    const anim = anims ? (attacking ? anims.attack : anims.idle) : undefined;
    // A animação de ataque começa do primeiro quadro, senão ela entra no meio
    // e o golpe não se lê.
    const clock = attacking ? now - (this.attackStarted.get(defender.id) ?? now) : now + defender.id * 91;

    // Criatura encara a Unidade mais próxima; construção nunca vira.
    const building = isBuilding(formById(defender.formId));
    let nearest: SimUnit | null = null;
    for (const unit of state.units) {
      if (
        nearest === null ||
        Math.abs(unit.x - defender.x) < Math.abs(nearest.x - defender.x)
      ) {
        nearest = unit;
      }
    }
    const facingLeft = !building && nearest !== null && nearest.x < defender.x;

    const drawn =
      anim !== undefined &&
      drawAnim(
        ctx,
        anim,
        centre,
        GROUND_Y,
        height,
        clock,
        facingLeft,
        hit ? PALETTE.damage : undefined,
        0.75,
      );

    if (!drawn) {
      ctx.fillStyle = hit ? PALETTE.damage : PALETTE.defender;
      ctx.fillRect(centre - height / 4, GROUND_Y - height, height / 2, height);
    }

    const barWidth = Math.max(16, Math.round(height * 0.6));
    const filled = Math.round(barWidth * Math.max(0, defender.hp / defender.maxHp));
    const barY = GROUND_Y - height - 6;
    ctx.fillStyle = PALETTE.hpLost;
    ctx.fillRect(centre - barWidth / 2, barY, barWidth, 3);
    ctx.fillStyle = PALETTE.hp;
    ctx.fillRect(centre - barWidth / 2, barY, filled, 3);
  }

  private drawUnit(
    ctx: CanvasRenderingContext2D,
    unit: SimUnit,
    now: number,
  ): void {
    const offset = laneOffset(unit.id);
    const centre = screenX(unit.x);
    const baseY = GROUND_Y + offset / 2;
    const hit = now < (this.flashUntil.get(unit.id) ?? 0);

    const anims = UNIT_ANIMS[unit.typeId];
    const anim = anims
      ? unit.targetId === null
        ? anims.walk
        : anims.attack
      : undefined;

    // Quem entrou pela direita marcha para a esquerda: sprite espelhado.
    const facingLeft = unit.side === 1;

    // O deslocamento por id desencontra as animações: sem isso a coluna inteira
    // anda em passo sincronizado e parece um só sprite repetido.
    const drawn =
      anim !== undefined &&
      drawAnim(
        ctx,
        anim,
        centre,
        baseY,
        UNIT_HEIGHT,
        now + unit.id * 57,
        facingLeft,
        hit ? PALETTE.damage : undefined,
        0.8,
      );

    if (!drawn) {
      ctx.fillStyle = hit ? PALETTE.damage : (UNIT_COLOR[unit.typeId] ?? PALETTE.unit);
      ctx.fillRect(centre - 2, baseY - 9, 5, 9);
    }

    if (unit.hp < unit.maxHp) {
      const w = 10;
      const barY = baseY - UNIT_HEIGHT * 0.55;
      ctx.fillStyle = PALETTE.hpLost;
      ctx.fillRect(centre - w / 2, barY, w, 1);
      ctx.fillStyle = PALETTE.hp;
      ctx.fillRect(centre - w / 2, barY, Math.max(0, (w * unit.hp) / unit.maxHp), 1);
    }
  }

  private drawHud(ctx: CanvasRenderingContext2D, state: BattleState): void {
    drawBox(ctx, 4, 2, VIEW_WIDTH - 8, 20);
    drawText(ctx, state.stage.name, 10, 6);
    drawText(ctx, `INIMIGOS ${state.defenders.length}`, VIEW_WIDTH - 88, 6, PALETTE.textDim);
    drawText(ctx, `${(state.ticks / 20).toFixed(1)}s`, VIEW_WIDTH - 34, 14, PALETTE.textDim);

    // Contador do Exército separado por Tipo (uma sigla e um número por tipo).
    drawBox(ctx, 4, VIEW_HEIGHT - 24, VIEW_WIDTH - 8, 20);
    const counts = new Map<string, number>();
    for (const unit of state.units) {
      counts.set(unit.typeId, (counts.get(unit.typeId) ?? 0) + 1);
    }
    if (counts.size === 0) {
      drawText(ctx, "EXERCITO DESTRUIDO", 10, VIEW_HEIGHT - 18, PALETTE.textDim);
      return;
    }
    let x = 10;
    for (const [typeId, count] of counts) {
      let short = typeId.slice(0, 3).toUpperCase();
      try {
        short = unitTypeById(typeId).short;
      } catch {
        // Tipo removido dos dados: a sigla derivada do id já serve.
      }
      drawText(ctx, `${short} ${count}`, x, VIEW_HEIGHT - 18, UNIT_COLOR[typeId]);
      x += 44;
    }
  }
}
