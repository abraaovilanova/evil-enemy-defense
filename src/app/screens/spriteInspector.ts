import { drawBox, drawText, PALETTE } from "../../render/palette";
import { VIEW_HEIGHT, VIEW_WIDTH } from "../../render/battleView";
import { FORM_ANIMS, UNIT_ANIMS, drawAnim, imageFor } from "../../render/sprites";
import type { Game, Screen } from "../screen";

interface Sheet {
  name: string;
  src: string;
  fw: number;
  fh: number;
}

/**
 * Ferramenta de desenvolvimento (tecla V): mostra cada linha de cada
 * spritesheet animando, para conferir qual linha é idle / andar / atacar.
 * O número da linha aqui é o mesmo que vai em `sprites.ts`.
 */
export class SpriteInspectorScreen implements Screen {
  private sheets: Sheet[] = [];
  private index = 0;

  constructor(
    private game: Game,
    private previous: Screen,
  ) {
    const seen = new Map<string, Sheet>();
    for (const [id, set] of [
      ...Object.entries(UNIT_ANIMS),
      ...Object.entries(FORM_ANIMS),
    ]) {
      for (const anim of Object.values(set)) {
        if (!seen.has(anim.src)) {
          seen.set(anim.src, { name: id, src: anim.src, fw: anim.fw, fh: anim.fh });
        }
      }
    }
    this.sheets = [...seen.values()];
  }

  handleKey(key: string): void {
    if (key === "v" || key === "V" || key === "Escape") {
      this.game.goto(this.previous);
      return;
    }
    if (key === "ArrowRight" || key === "ArrowDown") {
      this.index = (this.index + 1) % this.sheets.length;
    }
    if (key === "ArrowLeft" || key === "ArrowUp") {
      this.index = (this.index - 1 + this.sheets.length) % this.sheets.length;
    }
  }

  draw(ctx: CanvasRenderingContext2D, now: number): void {
    ctx.fillStyle = PALETTE.menu;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    const sheet = this.sheets[this.index];
    if (!sheet) return;
    const image = imageFor(sheet.src);

    drawBox(ctx, 4, 4, VIEW_WIDTH - 8, 20);
    drawText(ctx, `${sheet.name}  ${sheet.src.split("/").pop()}`, 10, 10);
    drawText(
      ctx,
      `${this.index + 1}/${this.sheets.length}`,
      VIEW_WIDTH - 40,
      10,
      PALETTE.textDim,
    );

    if (!image) {
      drawText(ctx, "SHEET NAO CARREGOU", 100, 90, PALETTE.hit);
      return;
    }

    const whole = sheet.fw === 0;
    const rows = whole ? 1 : Math.floor(image.height / sheet.fh);
    const cols = whole ? 1 : Math.floor(image.width / sheet.fw);
    const height = Math.min(44, (VIEW_HEIGHT - 50) / rows);

    for (let row = 0; row < rows; row++) {
      const y = 40 + row * height + height;
      drawText(ctx, `L${row}`, 8, y - height / 2, PALETTE.textDim);
      drawAnim(
        ctx,
        { src: sheet.src, fw: sheet.fw, fh: sheet.fh, row, frames: cols, fps: 8 },
        50,
        y,
        height,
        now,
      );
      drawText(ctx, `${cols}f`, 70, y - height / 2, PALETTE.textDim);
    }

    drawText(ctx, "SETAS TROCAM SHEET   V SAI", 10, VIEW_HEIGHT - 12, PALETTE.textDim);
  }
}
