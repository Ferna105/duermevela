// Lógica pura del juego Imitar: formas de los sonidos y comparación con el trazo del dedo.

export type Shape = 'sube' | 'baja' | 'sube-baja' | 'baja-sube';

export const SHAPES: Shape[] = ['sube', 'baja', 'sube-baja', 'baja-sube'];

/** Un punto del recorrido: tiempo (ms) y altura en semitonos relativa al centro. */
export interface Sample {
  t: number;
  semitones: number;
}

/**
 * Altura en semitonos para `u` (0 a 1) a lo largo del sonido.
 * Curvas de coseno: arrancan y terminan suave, como una voz.
 */
export function shapeAt(shape: Shape, u: number, span: number) {
  const half = span / 2;
  switch (shape) {
    case 'sube':
      return -half * Math.cos(Math.PI * u);
    case 'baja':
      return half * Math.cos(Math.PI * u);
    case 'sube-baja':
      return -half * Math.cos(2 * Math.PI * u);
    case 'baja-sube':
      return half * Math.cos(2 * Math.PI * u);
  }
}

/** Remuestrea un recorrido a `n` puntos equiespaciados en su propia duración. */
export function resample(samples: Sample[], n: number): number[] {
  if (samples.length === 0) return [];
  const t0 = samples[0].t;
  const duration = samples[samples.length - 1].t - t0;
  const out: number[] = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const t = t0 + (duration * i) / (n - 1);
    while (j < samples.length - 2 && samples[j + 1].t < t) j++;
    const a = samples[j];
    const b = samples[Math.min(j + 1, samples.length - 1)];
    const k = b.t === a.t ? 0 : Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)));
    out.push(a.semitones + (b.semitones - a.semitones) * k);
  }
  return out;
}

/** Correlación de Pearson (−1 a 1). 0 si alguno de los dos es plano. */
export function correlation(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const mean = (xs: number[]) => xs.slice(0, n).reduce((s, x) => s + x, 0) / n;
  const ma = mean(a);
  const mb = mean(b);
  let cov = 0;
  let va = 0;
  let vb = 0;
  for (let i = 0; i < n; i++) {
    cov += (a[i] - ma) * (b[i] - mb);
    va += (a[i] - ma) ** 2;
    vb += (b[i] - mb) ** 2;
  }
  if (va === 0 || vb === 0) return 0;
  return cov / Math.sqrt(va * vb);
}

/**
 * ¿El dedo dibujó la misma forma que el sonido? Compara la forma, no la velocidad
 * ni el tamaño: subir rápido o despacio, mucho o poco, vale igual.
 */
export function matchesShape(
  shape: Shape,
  drawn: Sample[],
  { minSimilarity, minRangeSemitones }: { minSimilarity: number; minRangeSemitones: number },
) {
  const n = 32;
  const values = resample(drawn, n);
  if (values.length < 2) return false;
  const range = Math.max(...values) - Math.min(...values);
  if (range < minRangeSemitones) return false;
  const target = Array.from({ length: n }, (_, i) => shapeAt(shape, i / (n - 1), 1));
  return correlation(values, target) >= minSimilarity;
}
