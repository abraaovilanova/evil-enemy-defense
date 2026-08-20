import { drawBox, drawText, PALETTE } from "../render/palette";

export interface MenuItem {
  label: string;
  /** Texto alinhado à direita (custo, quantidade, estado). */
  right?: string;
  disabled?: boolean;
  onSelect?: () => void;
  /** Setas esquerda/direita sobre o item, para ajustar valores. */
  onAdjust?: (delta: number) => void;
}

export interface MenuRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const ROW_HEIGHT = 10;
const PADDING_X = 8;
const PADDING_Y = 7;

/**
 * Menu estilo FF1: caixa azul, cursor "▶", teclado como interface primária e
 * mouse por hit-test manual (ADR 0002, Q27).
 */
export class Menu {
  index = 0;
  private items: MenuItem[] = [];
  /** Primeira linha visível, para listas maiores que a caixa. */
  private scroll = 0;

  constructor(
    private rect: MenuRect,
    private title?: string,
  ) {}

  setItems(items: MenuItem[]): void {
    this.items = items;
    if (this.index >= items.length) this.index = Math.max(0, items.length - 1);
    this.clampScroll();
  }

  get current(): MenuItem | undefined {
    return this.items[this.index];
  }

  private get titleOffset(): number {
    return this.title ? ROW_HEIGHT : 0;
  }

  private get visibleRows(): number {
    return Math.max(
      1,
      Math.floor((this.rect.h - PADDING_Y * 2 - this.titleOffset) / ROW_HEIGHT),
    );
  }

  private clampScroll(): void {
    const rows = this.visibleRows;
    if (this.index < this.scroll) this.scroll = this.index;
    if (this.index >= this.scroll + rows) this.scroll = this.index - rows + 1;
    this.scroll = Math.max(0, Math.min(this.scroll, Math.max(0, this.items.length - rows)));
  }

  private move(delta: number): void {
    if (this.items.length === 0) return;
    // Pula itens desabilitados; para se todos forem.
    for (let attempts = 0; attempts < this.items.length; attempts++) {
      this.index =
        (this.index + delta + this.items.length) % this.items.length;
      if (!this.items[this.index]?.disabled) break;
    }
    this.clampScroll();
  }

  /** Retorna true se consumiu a tecla. */
  handleKey(key: string): boolean {
    switch (key) {
      case "ArrowUp":
      case "w":
        this.move(-1);
        return true;
      case "ArrowDown":
      case "s":
        this.move(1);
        return true;
      case "ArrowLeft":
      case "a":
        this.current?.onAdjust?.(-1);
        return true;
      case "ArrowRight":
      case "d":
        this.current?.onAdjust?.(1);
        return true;
      case "Enter":
      case " ":
        if (this.current && !this.current.disabled) this.current.onSelect?.();
        return true;
      default:
        return false;
    }
  }

  /** Coordenadas já convertidas para o espaço do canvas (320x180). */
  handlePointer(x: number, y: number, click: boolean): void {
    const rowsTop = this.rect.y + PADDING_Y + this.titleOffset;
    if (x < this.rect.x || x > this.rect.x + this.rect.w) return;
    const row = Math.floor((y - rowsTop) / ROW_HEIGHT);
    if (row < 0 || row >= this.visibleRows) return;
    const index = this.scroll + row;
    const item = this.items[index];
    if (!item || item.disabled) return;
    this.index = index;
    if (click) item.onSelect?.();
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { x, y, w, h } = this.rect;
    drawBox(ctx, x, y, w, h);
    if (this.title) drawText(ctx, this.title, x + PADDING_X, y + PADDING_Y);

    const rowsTop = y + PADDING_Y + this.titleOffset;
    const visible = this.items.slice(this.scroll, this.scroll + this.visibleRows);

    visible.forEach((item, row) => {
      const index = this.scroll + row;
      const rowY = rowsTop + row * ROW_HEIGHT;
      const color = item.disabled ? PALETTE.textDim : PALETTE.text;
      if (index === this.index) drawText(ctx, "▶", x + PADDING_X - 2, rowY);
      drawText(ctx, item.label, x + PADDING_X + 8, rowY, color);
      if (item.right) {
        ctx.font = "8px monospace";
        const width = ctx.measureText(item.right).width;
        drawText(ctx, item.right, x + w - PADDING_X - width, rowY, color);
      }
    });

    if (this.items.length > this.visibleRows) {
      drawText(
        ctx,
        this.scroll > 0 ? "▲" : " ",
        x + w - PADDING_X,
        rowsTop - 6,
        PALETTE.textDim,
      );
      drawText(
        ctx,
        this.scroll + this.visibleRows < this.items.length ? "▼" : " ",
        x + w - PADDING_X,
        rowsTop + this.visibleRows * ROW_HEIGHT - 4,
        PALETTE.textDim,
      );
    }
  }
}
