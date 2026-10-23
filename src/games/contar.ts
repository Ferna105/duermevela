// Juego 3 – Contar: suenan de 1 a 5 vibraciones. Después hay que tocar la pantalla
// la misma cantidad de veces, de memoria.

import { now, playNote } from '@/audio/engine';
import { playMiss, playSuccess, playTick } from '@/audio/sounds';
import { CONTAR, ROUND_PAUSE_MS, VIBRATION_HZ } from '@/config';

import { randomBetween, randomInt } from './random';
import { runGame, Trigger } from './scope';
import type { Game } from './types';

export const contar: Game = ({ scope }) => {
  const tapped = new Trigger();
  let listening = false;
  let taps = 0;

  runGame(scope, async () => {
    while (true) {
      const count = randomInt(CONTAR.count.min, CONTAR.count.max);
      const freq = randomBetween(330, 440);
      const vibrationHz = randomBetween(VIBRATION_HZ.min, VIBRATION_HZ.max);
      const beepSec = CONTAR.beepMs / 1000;
      const stepSec = (CONTAR.beepMs + CONTAR.gapMs) / 1000;
      const at = now() + 0.05;
      for (let i = 0; i < count; i++) {
        playNote({
          freq,
          vibrationHz,
          vibrationDepth: 0.7,
          volume: 0.45,
          attackSec: 0.05,
          at: at + i * stepSec,
          durationSec: beepSec,
          releaseSec: 0.15,
        });
      }
      // Escuchar desde que termina la última vibración.
      await scope.wait(((count - 1) * stepSec + beepSec) * 1000 + 50);

      taps = 0;
      listening = true;
      const answered = await scope.wait(CONTAR.answerTimeoutMs, tapped);
      // Cada toque reinicia la espera; un silencio largo cierra la respuesta.
      if (answered) while (await scope.wait(CONTAR.endOfAnswerMs, tapped));
      listening = false;

      if (answered) {
        if (taps === count) playSuccess();
        else playMiss();
      }
      await scope.wait(ROUND_PAUSE_MS);
    }
  });

  return {
    onDown: () => {
      if (!listening) return;
      taps++;
      playTick();
      tapped.fire();
    },
  };
};
