import type { Stage } from "../../domain/types";
import { afterRun, hasCleared } from "../../domain/progression";
import { coinBreakdown } from "../../domain/rewards";
import {
  createBattle,
  resultOf,
  step,
  type ArmyEntry,
  type BattleState,
} from "../../sim/battle";
import { BattleView, VIEW_HEIGHT, VIEW_WIDTH } from "../../render/battleView";
import { drawBox, drawText, PALETTE } from "../../render/palette";
import type { Game, Screen } from "../screen";
import { StageSelectScreen } from "./stageSelect";

export class BattleScreen implements Screen {
  private state: BattleState;
  private view = new BattleView();
  private settled = false;
  /** Moedas do fim da Run, creditadas uma única vez. */
  private finalCoins = 0;

  constructor(
    private game: Game,
    stage: Stage,
    army: ArmyEntry[],
  ) {
    this.state = createBattle(stage, army);
  }

  tick(): void {
    if (this.state.outcome !== "running") return;
    step(this.state);
    if (this.state.outcome !== "running") this.settle();
  }

  private settle(): void {
    if (this.settled) return;
    this.settled = true;
    const won = this.state.outcome === "victory";
    const breakdown = coinBreakdown(
      this.state.stage,
      resultOf(this.state),
      hasCleared(this.game.player, this.state.stage.id),
    );
    this.finalCoins = breakdown.total;
    this.game.updatePlayer(
      afterRun(this.game.player, this.state.stage.id, this.finalCoins, won),
    );
  }

  handleKey(key: string): void {
    if (key === " ") {
      this.game.speed = this.game.speed === 1 ? 3 : 1;
      return;
    }
    if (this.state.outcome !== "running" && (key === "Enter" || key === "Escape")) {
      this.game.goto(new StageSelectScreen(this.game));
    }
  }

  handlePointer(_x: number, _y: number, click: boolean): void {
    if (click && this.state.outcome !== "running") {
      this.game.goto(new StageSelectScreen(this.game));
    }
  }

  draw(ctx: CanvasRenderingContext2D, now: number): void {
    this.view.draw(ctx, this.state, now);

    const running = this.state.outcome === "running";
    // Contador ao vivo: as parcelas já garantidas (dano, tempo, sobreviventes).
    // Como a fórmula é a mesma do fim da Run, o número não muda de significado.
    const breakdown = coinBreakdown(
      this.state.stage,
      resultOf(this.state),
      hasCleared(this.game.player, this.state.stage.id),
      running,
    );

    drawText(ctx, `${breakdown.total}$`, VIEW_WIDTH - 34, VIEW_HEIGHT - 18, PALETTE.text);
    drawText(ctx, `x${this.game.speed}`, VIEW_WIDTH - 34, 6, PALETTE.textDim);

    if (!running) this.drawSummary(ctx, breakdown.total);
  }

  /** Fim de Run: o total e de onde veio cada parcela. */
  private drawSummary(ctx: CanvasRenderingContext2D, _total: number): void {
    const breakdown = coinBreakdown(
      this.state.stage,
      resultOf(this.state),
      hasCleared(this.game.player, this.state.stage.id),
    );
    const won = this.state.outcome === "victory";

    drawBox(ctx, 90, 40, 140, 96);
    drawText(ctx, won ? "VITORIA" : "DERROTA", 96, 46, won ? PALETTE.hp : PALETTE.hit);
    drawText(ctx, `DANO       ${breakdown.damage}`, 96, 62, PALETTE.textDim);
    drawText(
      ctx,
      `${won ? "RAPIDEZ" : "TEMPO  "}    ${breakdown.time}`,
      96,
      72,
      PALETTE.textDim,
    );
    drawText(ctx, `SOBREVIVEM ${breakdown.survivors}`, 96, 82, PALETTE.textDim);
    drawText(ctx, `VITORIA    ${breakdown.victory}`, 96, 92, PALETTE.textDim);
    drawText(ctx, `TOTAL      ${this.finalCoins}$`, 96, 106);
    drawText(ctx, "ENTER CONTINUA", 96, 122, PALETTE.textDim);
  }
}
