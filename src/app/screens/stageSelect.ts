import { STAGES } from "../../domain/stages";
import { hasCleared, isStageUnlocked } from "../../domain/progression";
import { drawBox, drawText, PALETTE } from "../../render/palette";
import { VIEW_HEIGHT, VIEW_WIDTH } from "../../render/battleView";
import { Menu } from "../../ui/menu";
import type { Game, Screen } from "../screen";
import { ArmyBuilderScreen } from "./armyBuilder";
import { ShopScreen } from "./shop";

export class StageSelectScreen implements Screen {
  private menu = new Menu({ x: 8, y: 30, w: VIEW_WIDTH - 16, h: 116 }, "ESTAGIO");

  constructor(private game: Game) {
    this.refresh();
  }

  private refresh(): void {
    const items = STAGES.map((stage) => {
      const unlocked = isStageUnlocked(this.game.player, stage.id);
      return {
        label: unlocked ? stage.name : "? ? ?",
        right: !unlocked
          ? "TRANCADO"
          : hasCleared(this.game.player, stage.id)
            ? "LIMPO"
            : "NOVO",
        disabled: !unlocked,
        onSelect: () => this.game.goto(new ArmyBuilderScreen(this.game, stage)),
      };
    });
    items.push({
      label: "LOJA",
      right: `${this.game.player.coins}$`,
      disabled: false,
      onSelect: () => this.game.goto(new ShopScreen(this.game)),
    });
    this.menu.setItems(items);
  }

  handleKey(key: string): void {
    this.menu.handleKey(key);
  }

  handlePointer(x: number, y: number, click: boolean): void {
    this.menu.handlePointer(x, y, click);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = PALETTE.menu;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    drawBox(ctx, 8, 4, VIEW_WIDTH - 16, 22);
    drawText(ctx, "EVIL ENEMY DEFENSE", 16, 11);
    drawText(
      ctx,
      `${this.game.player.coins}$`,
      VIEW_WIDTH - 60,
      11,
      PALETTE.textDim,
    );
    this.refresh();
    this.menu.draw(ctx);
    drawText(ctx, "SETAS MOVEM  ENTER CONFIRMA", 12, VIEW_HEIGHT - 14, PALETTE.textDim);
  }
}
