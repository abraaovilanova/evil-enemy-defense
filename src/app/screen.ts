import type { PlayerState } from "../domain/progression";

export interface Screen {
  /** Um passo de simulação de tempo fixo. Telas de menu não precisam. */
  tick?(): void;
  draw(ctx: CanvasRenderingContext2D, now: number): void;
  handleKey?(key: string): void;
  handlePointer?(x: number, y: number, click: boolean): void;
}

/** O que toda tela pode fazer com o jogo em volta dela. */
export interface Game {
  readonly player: PlayerState;
  /** Atualiza a Meta-progressão e persiste. */
  updatePlayer(next: PlayerState): void;
  goto(screen: Screen): void;
  /** Composição escolhida na última montagem, por tipo. Sobrevive entre telas. */
  composition: Record<string, number>;
  /** Velocidade da simulação, alternada com espaço durante a Run. */
  speed: number;
}
