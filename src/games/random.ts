export function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** Entero entre `min` y `max`, ambos incluidos. */
export function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1));
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
