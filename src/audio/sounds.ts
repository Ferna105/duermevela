// Sonidos de respuesta: suaves y cortos, para no despertar a nadie.

import { now, playNote } from './engine';

/** Dos notas que suben: acierto. */
export function playSuccess() {
  const t = now();
  playNote({ freq: 392, at: t, durationSec: 0.7, releaseSec: 0.5, volume: 0.22 });
  playNote({ freq: 523.25, at: t + 0.22, durationSec: 1, releaseSec: 0.7, volume: 0.2 });
}

/** Una nota grave que cae apenas: no salió, sin retar. */
export function playMiss() {
  const t = now();
  const tone = playNote({ freq: 262, at: t, durationSec: 0.8, releaseSec: 0.6, volume: 0.2 });
  tone.glide(
    [
      [0, 262],
      [0.6, 233],
    ],
    t,
  );
}

/** Toque registrado (juego Contar). */
export function playTick() {
  playNote({ freq: 330, type: 'triangle', durationSec: 0.09, releaseSec: 0.06, volume: 0.16 });
}
