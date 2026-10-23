// Juego 2 – Luz: con un zumbido vibrante de fondo, la pantalla espera negra.
// De repente se pone blanca (se nota a través de los párpados) y hay que tocarla.

import { Tone } from '@/audio/engine';
import { playSuccess } from '@/audio/sounds';
import { LUZ } from '@/config';

import { randomBetween } from './random';
import { runGame, Trigger } from './scope';
import type { Game } from './types';

export const luz: Game = ({ scope, setLight, fallAsleep }) => {
  const tapped = new Trigger();
  let lit = false;

  // Se corta solo al salir o al dormirse (stopAll).
  new Tone({
    freq: LUZ.droneHz,
    type: 'triangle',
    vibrationHz: LUZ.droneVibrationHz,
    vibrationDepth: 0.5,
    volume: 0.3,
    attackSec: 3,
  });

  runGame(scope, async () => {
    while (true) {
      await scope.wait(randomBetween(LUZ.darkMs.min, LUZ.darkMs.max));
      lit = true;
      setLight(true);
      const hit = await scope.wait(LUZ.fadeInMs + LUZ.lightTimeoutMs, tapped);
      lit = false;
      setLight(false);
      if (!hit) {
        // Nadie tocó la luz: seguramente se durmió. No dejar la pantalla prendida.
        fallAsleep();
        return;
      }
      playSuccess();
    }
  });

  return {
    // Tocar con la pantalla negra no hace nada.
    onDown: () => {
      if (lit) tapped.fire();
    },
  };
};
