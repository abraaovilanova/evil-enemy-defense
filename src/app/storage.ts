import { initialPlayer, type PlayerState } from "../domain/progression";

const KEY = "eed.save.v1";

/** Save local (ADR: sem backend). Save corrompido vira jogo novo, sem drama. */
export function loadPlayer(): PlayerState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialPlayer();
    const parsed = JSON.parse(raw) as Partial<PlayerState>;
    if (
      typeof parsed.coins !== "number" ||
      typeof parsed.capacity !== "number" ||
      typeof parsed.levels !== "object" ||
      parsed.levels === null ||
      !Array.isArray(parsed.cleared)
    ) {
      return initialPlayer();
    }
    return {
      coins: parsed.coins,
      capacity: parsed.capacity,
      levels: parsed.levels,
      cleared: parsed.cleared,
    };
  } catch {
    return initialPlayer();
  }
}

export function savePlayer(player: PlayerState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(player));
  } catch {
    // Modo privado / quota cheia: o jogo continua, só não persiste.
  }
}

export function clearSave(): void {
  localStorage.removeItem(KEY);
}
