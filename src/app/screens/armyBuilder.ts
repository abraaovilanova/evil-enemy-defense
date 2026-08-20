import type { Side, Stage } from "../../domain/types";
import { allUnitTypeIds, isUnlocked, levelOf } from "../../domain/progression";
import { damageAtLevel, hpAtLevel, unitTypeById } from "../../domain/unitTypes";
import { formById } from "../../domain/forms";
import { drawBox, drawText, PALETTE } from "../../render/palette";
import { VIEW_HEIGHT, VIEW_WIDTH } from "../../render/battleView";
import { Menu, type MenuItem } from "../../ui/menu";
import type { Game, Screen } from "../screen";
import type { ArmyEntry } from "../../sim/battle";
import { BattleScreen } from "./battle";
import { StageSelectScreen } from "./stageSelect";

/** Chave da composição: um contador por tipo **e** por Entrada. */
export function slotKey(typeId: string, side: Side): string {
  return `${typeId}:${side}`;
}

/**
 * Montagem do Exército: a única decisão tática do jogo (ADR 0003). Além de
 * quantos de cada tipo, o jogador decide **por qual lado** cada parcela entra
 * (ADR 0004) — concentrar tudo de um lado atravessa rápido, mas deixa a
 * Guarnição do outro lado vindo por trás.
 */
export class ArmyBuilderScreen implements Screen {
  private menu = new Menu({ x: 6, y: 26, w: 190, h: 120 }, "EXERCITO");

  constructor(
    private game: Game,
    private stage: Stage,
  ) {}

  private countOf(typeId: string, side: Side): number {
    return this.game.composition[slotKey(typeId, side)] ?? 0;
  }

  private get used(): number {
    return this.rows().reduce(
      (total, [typeId, side]) => total + this.countOf(typeId, side),
      0,
    );
  }

  /** Uma linha por Tipo desbloqueado e por Entrada. */
  private rows(): Array<[string, Side]> {
    const unlocked = allUnitTypeIds().filter((id) => isUnlocked(this.game.player, id));
    const rows: Array<[string, Side]> = [];
    for (const id of unlocked) {
      rows.push([id, -1]);
      rows.push([id, 1]);
    }
    return rows;
  }

  private adjust(typeId: string, side: Side, delta: number): void {
    const room = this.game.player.capacity - this.used;
    const next = Math.max(0, this.countOf(typeId, side) + Math.min(delta, room));
    this.game.composition[slotKey(typeId, side)] = next;
  }

  private army(): ArmyEntry[] {
    return this.rows()
      .filter(([typeId, side]) => this.countOf(typeId, side) > 0)
      .map(([typeId, side]) => ({
        typeId,
        side,
        level: levelOf(this.game.player, typeId),
        count: this.countOf(typeId, side),
      }));
  }

  private refresh(): void {
    const items: MenuItem[] = this.rows().map(([typeId, side]) => {
      const type = unitTypeById(typeId);
      const level = levelOf(this.game.player, typeId);
      return {
        label: `${side === -1 ? "ESQ" : "DIR"} ${type.short} N${level}`,
        right: `< ${this.countOf(typeId, side)} >`,
        onAdjust: (delta: number) => this.adjust(typeId, side, delta),
      };
    });
    items.push({
      label: "INICIAR RUN",
      right: this.used === 0 ? "VAZIO" : "",
      disabled: this.used === 0,
      onSelect: () =>
        this.game.goto(new BattleScreen(this.game, this.stage, this.army())),
    });
    items.push({ label: "VOLTAR", onSelect: () => this.back() });
    this.menu.setItems(items);
  }

  handleKey(key: string): void {
    if (key === "Escape" || key === "Backspace") {
      this.back();
      return;
    }
    this.menu.handleKey(key);
  }

  private back(): void {
    this.game.goto(new StageSelectScreen(this.game));
  }

  handlePointer(x: number, y: number, click: boolean): void {
    this.menu.handlePointer(x, y, click);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = PALETTE.menu;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    drawBox(ctx, 6, 2, VIEW_WIDTH - 12, 20);
    drawText(ctx, this.stage.name, 12, 8);
    drawText(
      ctx,
      `${this.used}/${this.game.player.capacity}`,
      VIEW_WIDTH - 46,
      8,
      this.used >= this.game.player.capacity ? PALETTE.hit : PALETTE.textDim,
    );

    this.refresh();
    this.menu.draw(ctx);
    this.drawInspector(ctx);
    drawText(ctx, "< > AJUSTAM   ESC VOLTA", 8, VIEW_HEIGHT - 12, PALETTE.textDim);
  }

  /**
   * Painel lateral: a Guarnição do Estágio, separada pelo lado do campo em que
   * cada Defensor está — é o que o jogador precisa para decidir a divisão.
   */
  private drawInspector(ctx: CanvasRenderingContext2D): void {
    drawBox(ctx, 200, 26, VIEW_WIDTH - 206, 120);
    const row = this.rows()[this.menu.index];

    if (row) {
      const type = unitTypeById(row[0]);
      const level = levelOf(this.game.player, row[0]);
      drawText(ctx, type.name.toUpperCase(), 206, 32);
      drawText(ctx, `HP  ${hpAtLevel(type, level)}`, 206, 44, PALETTE.textDim);
      drawText(ctx, `DAN ${damageAtLevel(type, level)}`, 206, 54, PALETTE.textDim);
      drawText(ctx, `ARM ${type.armor}`, 206, 64, PALETTE.textDim);
      drawText(ctx, `ALC ${type.range}`, 206, 74, PALETTE.textDim);
      drawText(ctx, `VEL ${type.speed}`, 206, 84, PALETTE.textDim);
    }

    drawText(ctx, "GUARNICAO", 206, 100);
    const left = this.stage.garrison.filter((slot) => slot.x < 0).length;
    const right = this.stage.garrison.filter((slot) => slot.x > 0).length;
    const centre = this.stage.garrison.filter((slot) => slot.x === 0);
    drawText(ctx, `ESQ ${left}   DIR ${right}`, 206, 112, PALETTE.textDim);
    const main = centre[0];
    if (main) {
      drawText(ctx, formById(main.formId).name, 206, 124, PALETTE.textDim);
    }
    drawText(ctx, `TOTAL ${this.stage.garrison.length}`, 206, 136, PALETTE.textDim);
  }
}
