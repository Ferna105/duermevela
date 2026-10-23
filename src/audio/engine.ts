import {
  AudioContext,
  AudioManager,
  type AudioNode,
  type GainNode,
  type OscillatorNode,
  type OscillatorType,
} from 'react-native-audio-api';

import { MASTER_VOLUME, PITCH_HZ } from '@/config';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const active = new Set<Tone>();

function audio() {
  if (!ctx || !master) {
    // 'playback' para que suene aunque el iPhone esté en silencio (de noche suele estarlo).
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playback',
      iosMode: 'default',
      iosOptions: ['mixWithOthers'],
    });
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(ctx.destination);
  }
  return { ctx, master };
}

/** Tiempo actual del reloj de audio, en segundos. */
export function now() {
  return audio().ctx.currentTime;
}

let suspendTimer: ReturnType<typeof setTimeout> | undefined;

export async function resumeAudio() {
  clearTimeout(suspendTimer);
  const { ctx } = audio();
  if (ctx.state !== 'running') await ctx.resume();
}

/**
 * Pausa el motor de audio para no gastar batería, después de `delayMs`
 * (para dejar terminar los fundidos). Un `resumeAudio()` en el medio lo cancela.
 */
export function suspendAudio(delayMs = 0) {
  clearTimeout(suspendTimer);
  suspendTimer = setTimeout(() => {
    if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
  }, delayMs);
}

export function clampHz(hz: number) {
  return Math.min(PITCH_HZ.max, Math.max(PITCH_HZ.min, hz));
}

export function semitonesToHz(baseHz: number, semitones: number) {
  return baseHz * 2 ** (semitones / 12);
}

export interface ToneOptions {
  freq: number;
  /** Velocidad de la vibración (Hz). 0 = tono liso. */
  vibrationHz?: number;
  /** Profundidad de la vibración, 0–1. */
  vibrationDepth?: number;
  volume?: number;
  type?: OscillatorType;
  attackSec?: number;
  /** Momento de inicio, en tiempo de audio. Por defecto, ya. */
  at?: number;
}

/**
 * Un tono que vibra: oscilador → tremolo (volumen modulado por un LFO) → envolvente → salida.
 * Arranca al crearlo y termina con `release()`.
 */
export class Tone {
  private osc: OscillatorNode;
  private lfo?: OscillatorNode;
  private env: GainNode;

  constructor({
    freq,
    vibrationHz = 0,
    vibrationDepth = 0.6,
    volume = 0.5,
    type = 'sine',
    attackSec = 0.15,
    at,
  }: ToneOptions) {
    const { ctx, master } = audio();
    const start = Math.max(at ?? 0, ctx.currentTime);

    this.osc = ctx.createOscillator();
    this.osc.type = type;
    this.osc.frequency.value = clampHz(freq);

    this.env = ctx.createGain();
    this.env.gain.value = 0;
    this.env.gain.setValueAtTime(0, start);
    this.env.gain.linearRampToValueAtTime(volume, start + attackSec);

    let out: AudioNode = this.osc;
    if (vibrationHz > 0) {
      // ganancia = (1 - d/2) + (d/2)·sen(2π·f·t): el volumen late entre 1-d y 1.
      const tremolo = ctx.createGain();
      tremolo.gain.value = 1 - vibrationDepth / 2;
      const depth = ctx.createGain();
      depth.gain.value = vibrationDepth / 2;
      this.lfo = ctx.createOscillator();
      this.lfo.frequency.value = vibrationHz;
      this.lfo.connect(depth);
      depth.connect(tremolo.gain);
      this.osc.connect(tremolo);
      out = tremolo;
      this.lfo.start(start);
    }
    out.connect(this.env);
    this.env.connect(master);

    this.osc.onEnded = () => {
      this.env.disconnect();
      active.delete(this);
    };
    this.osc.start(start);
    active.add(this);
  }

  /** Cambia la altura suavemente (para seguir al dedo en tiempo real). */
  setFreq(freq: number, smoothingSec = 0.03) {
    this.osc.frequency.setTargetAtTime(clampHz(freq), now(), smoothingSec);
  }

  /** Programa un recorrido de alturas: puntos [segundos desde `at`, Hz]. */
  glide(points: [number, number][], at = now()) {
    const f = this.osc.frequency;
    points.forEach(([t, hz], i) => {
      if (i === 0) f.setValueAtTime(clampHz(hz), at + t);
      else f.linearRampToValueAtTime(clampHz(hz), at + t);
    });
  }

  /** Fundido de salida y fin del tono. Puede llamarse de nuevo para adelantar el final. */
  release(fadeSec = 0.35, at = now()) {
    const t = Math.max(at, now());
    const g = this.env.gain;
    g.cancelAndHoldAtTime(t);
    g.linearRampToValueAtTime(0, t + fadeSec);
    this.osc.stop(t + fadeSec + 0.05);
    this.lfo?.stop(t + fadeSec + 0.05);
  }
}

/** Nota corta programada: empieza en `at` y dura `durationSec` (incluido el fundido). */
export function playNote(opts: ToneOptions & { durationSec: number; releaseSec?: number }) {
  const at = Math.max(opts.at ?? 0, now());
  const releaseSec = opts.releaseSec ?? Math.min(0.3, opts.durationSec / 2);
  const tone = new Tone({ attackSec: 0.04, ...opts, at });
  tone.release(releaseSec, at + opts.durationSec - releaseSec);
  return tone;
}

/** Corta todo lo que esté sonando o programado, con un fundido. */
export function stopAll(fadeSec = 0.3) {
  active.forEach((tone) => tone.release(fadeSec));
}
