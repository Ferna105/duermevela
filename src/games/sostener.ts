// Juego 4 – Sostener: suena un tono de referencia y después se empieza a desafinar.
// Hay que mantenerlo en el mismo tono: si se agudiza, deslizar hacia abajo;
// si se pone grave, hacia arriba.

import { semitonesToHz, Tone } from '@/audio/engine';
import { playMiss, playSuccess } from '@/audio/sounds';
import { ROUND_PAUSE_MS, SEMITONE_SCREEN_FRACTION, SOSTENER, VIBRATION_HZ } from '@/config';

import { clamp, pick, randomBetween } from './random';
import { runGame } from './scope';
import type { Game } from './types';

export const sostener: Game = ({ scope, height }) => {
  const pxPerSemitone = height * SEMITONE_SCREEN_FRACTION;
  const max = SOSTENER.maxDeviationSemitones;
  // Corrección del dedo en semitonos. Se mantiene al levantar el dedo, como un deslizador.
  let offset = 0;
  let anchor: { y: number; offset: number } | null = null;
  let lastY = 0;

  const turnDelay = () =>
    randomBetween(SOSTENER.directionChangeMs.min, SOSTENER.directionChangeMs.max);

  runGame(scope, async () => {
    while (true) {
      const baseHz = randomBetween(300, 420);
      const tone = new Tone({
        freq: baseHz,
        vibrationHz: randomBetween(VIBRATION_HZ.min, VIBRATION_HZ.max),
        volume: 0.45,
        attackSec: 0.4,
      });
      await scope.wait(SOSTENER.referenceMs);

      offset = 0;
      if (anchor) anchor = { y: lastY, offset: 0 };
      let drift = 0;
      let direction = pick([-1, 1]);
      let nextTurn = Date.now() + turnDelay();
      let errorSum = 0;
      let ticks = 0;
      let last = Date.now();
      const end = last + SOSTENER.roundMs;

      while (Date.now() < end) {
        await scope.wait(SOSTENER.updateMs);
        const t = Date.now();
        if (t >= nextTurn) {
          direction = pick([-1, 1]);
          nextTurn = t + turnDelay();
        }
        drift = clamp(drift + (direction * SOSTENER.driftSemitonesPerSec * (t - last)) / 1000, -max, max);
        last = t;
        const deviation = clamp(drift + offset, -max, max);
        tone.setFreq(semitonesToHz(baseHz, deviation), 0.05);
        errorSum += Math.abs(deviation);
        ticks++;
      }

      tone.release(0.6);
      await scope.wait(900);
      if (errorSum / Math.max(1, ticks) <= SOSTENER.maxMeanErrorSemitones) playSuccess();
      else playMiss();
      await scope.wait(ROUND_PAUSE_MS);
    }
  });

  return {
    onDown: (p) => {
      anchor = { y: p.y, offset };
      lastY = p.y;
    },
    onMove: (p) => {
      lastY = p.y;
      if (anchor) offset = clamp(anchor.offset + (anchor.y - p.y) / pxPerSemitone, -max, max);
    },
    onUp: () => {
      anchor = null;
    },
  };
};
