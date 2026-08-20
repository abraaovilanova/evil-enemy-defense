/** Paleta estilo menu de FF1/FF2 no NES (ADR 0002). */
export const PALETTE = {
  /** Azul das caixas de menu. */
  menu: "#0000a8",
  border: "#ffffff",
  borderShade: "#7c7c7c",
  text: "#ffffff",
  textDim: "#a8a8a8",
  sky: "#3cbcfc",
  ground: "#00882c",
  groundDark: "#006818",
  unit: "#fcfcfc",
  unitRanged: "#fcbcb0",
  unitSiege: "#d8b070",
  defender: "#8c1800",
  hp: "#00b800",
  hpLost: "#780000",
  hit: "#fc9838",
  /** Tinta do dano: o alvo atingido fica vermelho por um instante. */
  damage: "#e01818",
} as const;

export const FONT = "8px monospace";

/** Caixa de menu FF: fundo azul, moldura branca dupla. */
export function drawBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.fillStyle = PALETTE.menu;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PALETTE.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.strokeStyle = PALETTE.borderShade;
  ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string = PALETTE.text,
): void {
  ctx.fillStyle = color;
  ctx.font = FONT;
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y);
}
