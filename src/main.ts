/** Ponto de entrada: monta o canvas, o laço de tempo fixo e o roteamento de telas. */
import { VIEW_HEIGHT, VIEW_WIDTH } from "./render/battleView";
import { startLoop } from "./app/loop";
import { loadPlayer, savePlayer } from "./app/storage";
import type { Game, Screen } from "./app/screen";
import { StageSelectScreen } from "./app/screens/stageSelect";
import type { PlayerState } from "./domain/progression";
import { loadSprites } from "./render/sprites";
import { SpriteInspectorScreen } from "./app/screens/spriteInspector";

const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;
const ctx = canvas.getContext("2d")!;
ctx.imageSmoothingEnabled = false;

let player: PlayerState = loadPlayer();
let screen: Screen;

const game: Game = {
  get player() {
    return player;
  },
  updatePlayer(next) {
    player = next;
    savePlayer(player);
  },
  goto(next) {
    screen = next;
  },
  composition: {},
  speed: 1,
};

screen = new StageSelectScreen(game);

// Os sprites entram assim que carregam; até lá o render cai nos retângulos.
void loadSprites();

const loop = startLoop(
  () => screen.tick?.(),
  (now) => {
    loop.speed = game.speed;
    screen.draw(ctx, now);
  },
);

window.addEventListener("keydown", (event) => {
  // As telas cuidam das setas e do espaço; o navegador não deve rolar a página.
  if (event.key.startsWith("Arrow") || event.key === " ") event.preventDefault();
  // V abre o inspetor de sprites de qualquer tela (ferramenta de dev).
  if ((event.key === "v" || event.key === "V") && !(screen instanceof SpriteInspectorScreen)) {
    game.goto(new SpriteInspectorScreen(game, screen));
    return;
  }
  screen.handleKey?.(event.key);
});

/** Converte coordenadas do mouse para o espaço do canvas (320x180). */
function toCanvas(event: MouseEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * VIEW_HEIGHT,
  };
}

canvas.addEventListener("mousemove", (event) => {
  const { x, y } = toCanvas(event);
  screen.handlePointer?.(x, y, false);
});
canvas.addEventListener("click", (event) => {
  const { x, y } = toCanvas(event);
  screen.handlePointer?.(x, y, true);
});

function fit(): void {
  const scale = Math.max(
    1,
    Math.floor(
      Math.min(window.innerWidth / VIEW_WIDTH, window.innerHeight / VIEW_HEIGHT),
    ),
  );
  canvas.style.width = `${VIEW_WIDTH * scale}px`;
  canvas.style.height = `${VIEW_HEIGHT * scale}px`;
}
window.addEventListener("resize", fit);
fit();
