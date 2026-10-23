// Juego 1 – Imitar: suena un tono que sube, baja o sube y baja (3 s).
// Después la persona lo "toca" con el dedo, como un instrumento: el tono sigue al dedo.

import { now, semitonesToHz, Tone } from '@/audio/engine';
import { playMiss, playSuccess } from '@/audio/sounds';
import { IMITAR, ROUND_PAUSE_MS, SEMITONE_SCREEN_FRACTION, VIBRATION_HZ } from '@/config';

import { matchesShape, type Sample, type Shape, SHAPES, shapeAt } from './contour';
import { pick, randomBetween } from './random';
import { runGame, Trigger } from './scope';
import type { Game } from './types';

const VOLUME = 0.45;

interface Round {
  shape: Shape;
  span: number;
  centerHz: number;
  vibrationHz: number;
}

interface Attempt {
  anchorY: number;
  startedAt: number;
  tone: Tone;
  samples: Sample[];
}

export const imitar: Game = ({ scope, height, finger }) => {
  const pxPerSemitone = height * SEMITONE_SCREEN_FRACTION;
  const touched = new Trigger();
  const lifted = new Trigger();
  let round: Round | null = null;
  let answering = false;
  let attempt: Attempt | null = null;

  const startSemitones = (r: Round) => shapeAt(r.shape, 0, r.span);

  function begin(y: number, t: number) {
    if (!round || !answering || attempt) return;
    const semitones = startSemitones(round);
    attempt = {
      anchorY: y,
      startedAt: t,
      // El dedo arranca en la misma nota en la que arrancó el sonido.
      tone: new Tone({
        freq: semitonesToHz(round.centerHz, semitones),
        vibrationHz: round.vibrationHz,
        volume: VOLUME,
      }),
      samples: [{ t, semitones }],
    };
    touched.fire();
  }

  function follow(y: number, t: number) {
    if (!round || !attempt) return;
    // Subir el dedo sube el tono; la posición inicial del dedo no importa.
    const semitones = startSemitones(round) + (attempt.anchorY - y) / pxPerSemitone;
    attempt.samples.push({ t, semitones });
    attempt.tone.setFreq(semitonesToHz(round.centerHz, semitones));
  }

  function finish() {
    const done = attempt;
    attempt = null;
    done?.tone.release(0.3);
    return done;
  }

  async function playPattern(r: Round) {
    const sec = IMITAR.patternMs / 1000;
    const steps = 30;
    const at = now() + 0.05;
    const tone = new Tone({
      freq: semitonesToHz(r.centerHz, startSemitones(r)),
      vibrationHz: r.vibrationHz,
      volume: VOLUME,
      attackSec: 0.2,
      at,
    });
    tone.glide(
      Array.from({ length: steps + 1 }, (_, i): [number, number] => [
        (sec * i) / steps,
        semitonesToHz(r.centerHz, shapeAt(r.shape, i / steps, r.span)),
      ]),
      at,
    );
    tone.release(0.3, at + sec - 0.3);
    await scope.wait(IMITAR.patternMs + 100);
  }

  /** Espera el trazo del dedo. Devuelve null si no respondió a tiempo. */
  async function listenAnswer(): Promise<Sample[] | null> {
    answering = true;
    const f = finger();
    if (f) begin(f.y, Date.now());
    const deadline = Date.now() + IMITAR.answerTimeoutMs;
    try {
      while (true) {
        if (!attempt && !(await scope.wait(Math.max(0, deadline - Date.now()), touched))) {
          return null;
        }
        const startedAt = attempt?.startedAt ?? Date.now();
        await scope.wait(Math.max(0, IMITAR.maxAnswerMs - (Date.now() - startedAt)), lifted);
        const done = finish();
        // Un toque muy corto es accidental: se sigue esperando.
        if (done && Date.now() - done.startedAt >= IMITAR.minAnswerMs) return done.samples;
      }
    } finally {
      answering = false;
      finish();
    }
  }

  runGame(scope, async () => {
    while (true) {
      round = {
        shape: pick(SHAPES),
        span: randomBetween(IMITAR.spanSemitones.min, IMITAR.spanSemitones.max),
        centerHz: randomBetween(300, 420),
        vibrationHz: randomBetween(VIBRATION_HZ.min, VIBRATION_HZ.max),
      };
      await playPattern(round);
      await scope.wait(400);
      const drawn = await listenAnswer();
      if (drawn) {
        await scope.wait(300);
        if (matchesShape(round.shape, drawn, IMITAR)) playSuccess();
        else playMiss();
      }
      await scope.wait(ROUND_PAUSE_MS);
    }
  });

  return {
    onDown: (p) => begin(p.y, p.t),
    onMove: (p) => follow(p.y, p.t),
    onUp: () => {
      if (attempt) lifted.fire();
    },
  };
};
