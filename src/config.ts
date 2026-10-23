// Todos los valores ajustables de la app en un solo lugar.

/**
 * "Vibración" del sonido: el volumen del tono late (modulación de amplitud)
 * a esta velocidad. 4–7 Hz es el rango de las ondas theta del cerebro
 * (somnolencia y sueño liviano). Un tono de 4.000–7.000 Hz sería un pitido
 * muy agudo, tipo mosquito, por eso la "frecuencia del sueño" se usa como
 * velocidad de vibración y no como altura del sonido.
 */
export const VIBRATION_HZ = { min: 4, max: 7 };

/** Altura (tono) de los sonidos, en Hz. Grave y suave, audible en el parlante del teléfono. */
export const PITCH_HZ = { min: 180, max: 900 };

/** Volumen general (0–1). */
export const MASTER_VOLUME = 0.7;

/** Cuánto hay que deslizar el dedo para subir un semitono, como fracción del alto de pantalla. */
export const SEMITONE_SCREEN_FRACTION = 1 / 30;

/** Pausa al entrar a un juego, para que la persona acomode el teléfono y cierre los ojos. */
export const START_DELAY_MS = 3000;

/** Pausa entre rondas. */
export const ROUND_PAUSE_MS = 2500;

/** Detección de "se quedó dormido". */
export const SLEEP = {
  /** Dedo apoyado y quieto durante este tiempo → se durmió. */
  stillMs: 15_000,
  /** Movimiento mínimo (px) para considerar que el dedo no está quieto. */
  stillTolerancePx: 14,
  /** Sin tocar la pantalla durante este tiempo → se durmió. */
  inactivityMs: 120_000,
  /** Duración del fundido del sonido al dormirse. */
  fadeOutMs: 4000,
};

/** Brillo de pantalla (0–1). */
export const BRIGHTNESS = {
  /** Mientras se juega con la pantalla negra. */
  dark: 0.05,
  /** Pantalla blanca del juego Luz: tiene que notarse a través de los párpados. */
  light: 1,
};

/** Juego 1 – Imitar. */
export const IMITAR = {
  patternMs: 3000,
  /** Recorrido del sonido, en semitonos. */
  spanSemitones: { min: 7, max: 12 },
  /** Tiempo máximo de respuesta con el dedo. */
  maxAnswerMs: 6000,
  /** Si no apoya el dedo en este tiempo, pasa a la siguiente ronda. */
  answerTimeoutMs: 10_000,
  /** Toques más cortos que esto se ignoran (toques accidentales). */
  minAnswerMs: 400,
  /** Parecido mínimo (correlación −1…1) entre el sonido y el dibujo del dedo. */
  minSimilarity: 0.6,
  /** Recorrido mínimo del dedo, en semitonos, para que no valga quedarse quieto. */
  minRangeSemitones: 2,
};

/** Juego 2 – Luz. */
export const LUZ = {
  /** Espera aleatoria con la pantalla negra antes de que se ponga blanca. */
  darkMs: { min: 8000, max: 25_000 },
  /** Fundido de negro a blanco. */
  fadeInMs: 900,
  /** Si la pantalla blanca no se toca en este tiempo, se asume que se durmió. */
  lightTimeoutMs: 12_000,
  droneHz: 196,
  droneVibrationHz: 4,
};

/** Juego 3 – Contar. */
export const CONTAR = {
  count: { min: 1, max: 5 },
  beepMs: 600,
  gapMs: 450,
  /** Si no toca en este tiempo, pasa a la siguiente ronda. */
  answerTimeoutMs: 10_000,
  /** Silencio después del último toque para dar la respuesta por terminada. */
  endOfAnswerMs: 2000,
};

/** Juego 4 – Sostener. */
export const SOSTENER = {
  /** Tono de referencia, quieto, antes de que empiece a moverse. */
  referenceMs: 2500,
  roundMs: 12_000,
  /** Velocidad a la que se desafina, en semitonos por segundo. */
  driftSemitonesPerSec: 0.9,
  /** Cada cuánto puede cambiar de dirección. */
  directionChangeMs: { min: 2000, max: 4500 },
  /** Desvío máximo acumulado, en semitonos. */
  maxDeviationSemitones: 12,
  /** Desvío promedio máximo para ganar, en semitonos. */
  maxMeanErrorSemitones: 1.5,
  updateMs: 40,
};
