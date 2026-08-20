/**
 * Carregamento e animação dos spritesheets do Tiny Swords.
 *
 * As grades abaixo foram medidas quadro a quadro nos arquivos originais, então
 * tamanho e contagem de frames estão corretos. As *linhas* dos sheets dos
 * cavaleiros (qual linha é idle, andar, atacar) são a suposição do layout
 * padrão do pack — se alguma animação parecer errada, troque só o `row` aqui.
 * A tecla V abre o inspetor de sprites, que mostra linha por linha.
 *
 * Os sheets do Enemy Pack têm uma animação por arquivo, em linha única.
 */

export interface Anim {
  src: string;
  /** Largura do quadro. 0 = a imagem inteira é um quadro só. */
  fw: number;
  /** Altura do quadro. */
  fh: number;
  row: number;
  frames: number;
  fps: number;
}

export interface AnimSet {
  idle: Anim;
  walk: Anim;
  attack: Anim;
}

/** Sheet dos cavaleiros/goblins: grade de 192x192, várias linhas. */
function knight(src: string, row: number, frames: number, fps = 10): Anim {
  return { src, fw: 192, fh: 192, row, frames, fps };
}

/** Sheet do Enemy Pack: uma animação por arquivo, quadros quadrados. */
function enemy(src: string, size: number, frames: number, fps = 10): Anim {
  return { src, fw: size, fh: size, row: 0, frames, fps };
}

/** Imagem única, sem animação (construções de pedra). */
function still(src: string): Anim {
  return { src, fw: 0, fh: 0, row: 0, frames: 1, fps: 1 };
}

/** Animações das Unidades do jogador, por id de Tipo de Unidade. */
export const UNIT_ANIMS: Record<string, AnimSet> = {
  warrior: {
    idle: knight("/sprites/warrior.png", 0, 6),
    walk: knight("/sprites/warrior.png", 1, 6),
    attack: knight("/sprites/warrior.png", 2, 6),
  },
  archer: {
    idle: knight("/sprites/archer.png", 0, 6),
    walk: knight("/sprites/archer.png", 1, 6),
    attack: knight("/sprites/archer.png", 2, 8),
  },
  bomber: {
    idle: knight("/sprites/bomber.png", 0, 6),
    walk: knight("/sprites/bomber.png", 1, 6),
    attack: knight("/sprites/bomber.png", 2, 7),
  },
  pawn: {
    idle: knight("/sprites/pawn.png", 0, 6),
    walk: knight("/sprites/pawn.png", 1, 6),
    attack: knight("/sprites/pawn.png", 2, 6),
  },
  lancer: {
    idle: enemy("/sprites/lancer_idle.png", 256, 7),
    walk: enemy("/sprites/lancer_walk.png", 256, 6),
    attack: enemy("/sprites/lancer_attack.png", 256, 8),
  },
  thief: {
    idle: enemy("/sprites/thief_idle.png", 192, 6),
    walk: enemy("/sprites/thief_walk.png", 192, 6, 14),
    attack: enemy("/sprites/thief_attack.png", 192, 6, 14),
  },
};

/** Animações do Defensor, por id de Forma. */
export const FORM_ANIMS: Record<string, AnimSet> = {
  goblin: {
    idle: knight("/sprites/goblin.png", 0, 7),
    walk: knight("/sprites/goblin.png", 1, 6),
    attack: knight("/sprites/goblin.png", 2, 6),
  },
  "great-orc": {
    idle: enemy("/sprites/gnoll_idle.png", 192, 6, 8),
    walk: enemy("/sprites/gnoll_walk.png", 192, 8),
    attack: enemy("/sprites/gnoll_attack.png", 192, 8, 12),
  },
  lizard: {
    idle: enemy("/sprites/lizard_idle.png", 192, 7, 8),
    walk: enemy("/sprites/lizard_walk.png", 192, 6),
    attack: enemy("/sprites/lizard_attack.png", 192, 9, 12),
  },
  bear: {
    idle: enemy("/sprites/bear_idle.png", 256, 8, 8),
    walk: enemy("/sprites/bear_walk.png", 256, 5),
    attack: enemy("/sprites/bear_attack.png", 256, 9, 12),
  },
  minotaur: {
    idle: enemy("/sprites/minotaur_idle.png", 320, 16, 10),
    walk: enemy("/sprites/minotaur_walk.png", 320, 8),
    attack: enemy("/sprites/minotaur_attack.png", 320, 12, 12),
  },
  troll: {
    idle: enemy("/sprites/troll_idle.png", 384, 12, 8),
    walk: enemy("/sprites/troll_walk.png", 384, 10, 8),
    attack: enemy("/sprites/troll_attack.png", 384, 6, 8),
  },
  // A torre de madeira é animada (8 quadros de 128x192); as de pedra e o
  // castelo são imagens únicas.
  "wood-tower": {
    idle: { src: "/sprites/wood_tower.png", fw: 128, fh: 192, row: 0, frames: 8, fps: 8 },
    walk: { src: "/sprites/wood_tower.png", fw: 128, fh: 192, row: 0, frames: 8, fps: 8 },
    attack: { src: "/sprites/wood_tower.png", fw: 128, fh: 192, row: 0, frames: 8, fps: 12 },
  },
  tower: {
    idle: still("/sprites/tower.png"),
    walk: still("/sprites/tower.png"),
    attack: still("/sprites/tower.png"),
  },
  "tower-blue": {
    idle: still("/sprites/tower_blue.png"),
    walk: still("/sprites/tower_blue.png"),
    attack: still("/sprites/tower_blue.png"),
  },
  "tower-purple": {
    idle: still("/sprites/tower_purple.png"),
    walk: still("/sprites/tower_purple.png"),
    attack: still("/sprites/tower_purple.png"),
  },
  castle: {
    idle: still("/sprites/castle.png"),
    walk: still("/sprites/castle.png"),
    attack: still("/sprites/castle.png"),
  },
};

const images = new Map<string, HTMLImageElement>();

/** Carrega todos os sheets referenciados. Falha em um não derruba o resto. */
export async function loadSprites(): Promise<void> {
  const sources = new Set<string>();
  for (const set of [...Object.values(UNIT_ANIMS), ...Object.values(FORM_ANIMS)]) {
    for (const anim of Object.values(set)) sources.add(anim.src);
  }

  await Promise.all(
    [...sources].map(
      (src) =>
        new Promise<void>((resolve) => {
          const image = new Image();
          image.onload = () => {
            images.set(src, image);
            resolve();
          };
          image.onerror = () => resolve();
          image.src = src;
        }),
    ),
  );
}

export function imageFor(src: string): HTMLImageElement | undefined {
  return images.get(src);
}

/**
 * Canvas auxiliar para tingir sprites. Reaproveitado entre chamadas: criar um
 * canvas por golpe seria lixo suficiente para engasgar o render.
 */
const scratch = document.createElement("canvas");
const scratchCtx = scratch.getContext("2d");

/**
 * Desenha o mesmo quadro por cima, tingido de `color`, respeitando o recorte
 * do sprite (`source-in` só pinta onde há pixel opaco). É assim que o dano
 * aparece: a criatura fica vermelha, não translúcida.
 */
function drawTint(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  color: string,
  strength: number,
): void {
  if (!scratchCtx) return;
  if (scratch.width !== sw || scratch.height !== sh) {
    scratch.width = sw;
    scratch.height = sh;
  }
  scratchCtx.clearRect(0, 0, sw, sh);
  scratchCtx.globalCompositeOperation = "source-over";
  scratchCtx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
  scratchCtx.globalCompositeOperation = "source-in";
  scratchCtx.fillStyle = color;
  scratchCtx.fillRect(0, 0, sw, sh);
  scratchCtx.globalCompositeOperation = "source-over";

  ctx.globalAlpha = strength;
  ctx.drawImage(scratch, 0, 0, sw, sh, dx, dy, dw, dh);
  ctx.globalAlpha = 1;
}

/**
 * Desenha um quadro da animação com a base do sprite em (x, y) — os pés do
 * personagem, não o canto do quadro. `elapsed` é o tempo em ms.
 * `tint` pinta o sprite (dano); `tintStrength` vai de 0 a 1.
 */
export function drawAnim(
  ctx: CanvasRenderingContext2D,
  anim: Anim,
  x: number,
  y: number,
  height: number,
  elapsed: number,
  flip = false,
  tint?: string,
  tintStrength = 0.7,
): boolean {
  const image = imageFor(anim.src);
  if (!image) return false;

  const whole = anim.fw === 0;
  const sw = whole ? image.width : anim.fw;
  const sh = whole ? image.height : anim.fh;
  const index = Math.floor((elapsed / 1000) * anim.fps) % anim.frames;
  const sx = whole ? 0 : index * sw;
  const sy = whole ? 0 : anim.row * sh;

  const scale = height / sh;
  const w = sw * scale;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(image, sx, sy, sw, sh, -w / 2, -height, w, height);
  if (tint) {
    drawTint(ctx, image, sx, sy, sw, sh, -w / 2, -height, w, height, tint, tintStrength);
  }
  ctx.restore();
  return true;
}
