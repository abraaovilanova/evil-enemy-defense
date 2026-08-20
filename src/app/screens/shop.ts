import {
  allUnitTypeIds,
  buyCapacity,
  buyLevel,
  buyUnlock,
  capacityCost,
  isTypeAvailable,
  isUnlocked,
  levelOf,
  levelUpCost,
  MAX_CAPACITY,
  MAX_LEVEL,
} from "../../domain/progression";
import { unitTypeById } from "../../domain/unitTypes";
import { drawBox, drawText, PALETTE } from "../../render/palette";
import { VIEW_HEIGHT, VIEW_WIDTH } from "../../render/battleView";
import { Menu, type MenuItem } from "../../ui/menu";
import type { Game, Screen } from "../screen";
import { StageSelectScreen } from "./stageSelect";

/** Meta-progressão: níveis, desbloqueios e Capacidade (Q8). */
export class ShopScreen implements Screen {
  private menu = new Menu({ x: 8, y: 28, w: VIEW_WIDTH - 16, h: 118 }, "LOJA");

  constructor(private game: Game) {}

  private refresh(): void {
    const player = this.game.player;
    const items: MenuItem[] = [];

    for (const id of allUnitTypeIds()) {
      const type = unitTypeById(id);
      // Tipo ainda travado por Estágio nem aparece na loja (Q4).
      if (!isUnlocked(player, id) && !isTypeAvailable(player, id)) continue;
      if (!isUnlocked(player, id)) {
        items.push({
          label: `DESBLOQUEAR ${type.name.toUpperCase()}`,
          right: `${type.unlockCost}$`,
          disabled: player.coins < type.unlockCost,
          onSelect: () => this.apply(buyUnlock(player, id)),
        });
        continue;
      }
      const level = levelOf(player, id);
      const maxed = level >= MAX_LEVEL;
      const cost = levelUpCost(level);
      items.push({
        label: `${type.name.toUpperCase()} N${level} -> N${level + 1}`,
        right: maxed ? "MAX" : `${cost}$`,
        disabled: maxed || player.coins < cost,
        onSelect: () => this.apply(buyLevel(player, id)),
      });
    }

    const capMaxed = player.capacity >= MAX_CAPACITY;
    const capCost = capacityCost(player.capacity);
    items.push({
      label: `CAPACIDADE ${player.capacity} -> ${player.capacity + 1}`,
      right: capMaxed ? "MAX" : `${capCost}$`,
      disabled: capMaxed || player.coins < capCost,
      onSelect: () => this.apply(buyCapacity(player)),
    });

    items.push({ label: "VOLTAR", onSelect: () => this.back() });
    this.menu.setItems(items);
  }

  private apply(next: ReturnType<typeof buyLevel>): void {
    if (next) this.game.updatePlayer(next);
  }

  private back(): void {
    this.game.goto(new StageSelectScreen(this.game));
  }

  handleKey(key: string): void {
    if (key === "Escape" || key === "Backspace") {
      this.back();
      return;
    }
    this.menu.handleKey(key);
  }

  handlePointer(x: number, y: number, click: boolean): void {
    this.menu.handlePointer(x, y, click);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = PALETTE.menu;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    drawBox(ctx, 8, 4, VIEW_WIDTH - 16, 20);
    drawText(ctx, "MOEDAS", 14, 10);
    drawText(ctx, `${this.game.player.coins}$`, VIEW_WIDTH - 60, 10);
    this.refresh();
    this.menu.draw(ctx);
    drawText(ctx, "ESC VOLTA", 12, VIEW_HEIGHT - 12, PALETTE.textDim);
  }
}
