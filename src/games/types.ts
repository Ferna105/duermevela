import type { Scope } from './scope';

/** Posición del dedo: `y` en px desde arriba, `t` en ms (Date.now). */
export interface TouchPoint {
  y: number;
  t: number;
}

/** Lo que la pantalla le ofrece a cada juego. */
export interface GameContext {
  scope: Scope;
  /** Alto de la zona táctil, en px. */
  height: number;
  /** Pone la pantalla blanca (true) o negra (false). */
  setLight(on: boolean): void;
  /** El juego detectó que la persona se durmió. */
  fallAsleep(): void;
  /** Dedo apoyado ahora mismo, o null. */
  finger(): TouchPoint | null;
}

export interface GameHandlers {
  onDown?(p: TouchPoint): void;
  onMove?(p: TouchPoint): void;
  onUp?(p: TouchPoint): void;
}

/** Un juego arranca su ciclo con `runGame` y devuelve qué hacer con los toques. */
export type Game = (ctx: GameContext) => GameHandlers;
