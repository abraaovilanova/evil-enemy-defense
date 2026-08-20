import { TICK_SECONDS } from "../domain/types";

export interface LoopHandle {
  stop(): void;
  /** Multiplicador de velocidade da simulação (1 = tempo real). */
  speed: number;
}

/**
 * Laço de tempo fixo (ADR 0001): a simulação sempre avança em passos de
 * TICK_SECONDS, independente da taxa de quadros. O render só lê o estado.
 */
export function startLoop(
  onTick: () => void,
  onDraw: (now: number) => void,
): LoopHandle {
  let accumulator = 0;
  let last = performance.now();
  let running = true;
  const handle: LoopHandle = {
    speed: 1,
    stop() {
      running = false;
    },
  };

  const frame = (now: number): void => {
    if (!running) return;
    // Clamp: uma aba em segundo plano não pode gerar mil ticks de uma vez.
    const elapsed = Math.min((now - last) / 1000, 0.25) * handle.speed;
    last = now;
    accumulator += elapsed;

    while (accumulator >= TICK_SECONDS) {
      onTick();
      accumulator -= TICK_SECONDS;
    }
    onDraw(now);
    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
  return handle;
}
