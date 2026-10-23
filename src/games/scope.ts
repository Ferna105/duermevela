/** Se lanza en las esperas pendientes cuando el juego se cancela (salir o dormirse). */
export class Cancelled extends Error {}

/** Algo que el juego espera desde afuera, por ejemplo un toque. */
export class Trigger {
  private waiters = new Set<() => void>();

  fire() {
    const waiters = [...this.waiters];
    this.waiters.clear();
    waiters.forEach((w) => w());
  }

  listen(waiter: () => void) {
    this.waiters.add(waiter);
    return () => {
      this.waiters.delete(waiter);
    };
  }
}

/**
 * Ciclo de vida de un juego. Todas las esperas pasan por acá para que
 * `cancel()` corte el juego en cualquier punto.
 */
export class Scope {
  private pending = new Set<() => void>();
  cancelled = false;

  /**
   * Espera `ms` milisegundos, o hasta que se dispare `trigger`.
   * Devuelve true si se disparó el trigger y false si se cumplió el tiempo.
   */
  wait(ms: number, trigger?: Trigger): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.cancelled) {
        reject(new Cancelled());
        return;
      }
      let timer: ReturnType<typeof setTimeout> | undefined;
      let unlisten = () => {};
      const finish = (result: boolean | Cancelled) => {
        clearTimeout(timer);
        unlisten();
        this.pending.delete(onCancel);
        if (result instanceof Cancelled) reject(result);
        else resolve(result);
      };
      const onCancel = () => finish(new Cancelled());
      this.pending.add(onCancel);
      if (Number.isFinite(ms)) timer = setTimeout(() => finish(false), ms);
      if (trigger) unlisten = trigger.listen(() => finish(true));
    });
  }

  cancel() {
    this.cancelled = true;
    [...this.pending].forEach((onCancel) => onCancel());
  }
}

/** Corre el juego y descarta la cancelación, que es la forma normal de terminar. */
export function runGame(scope: Scope, loop: () => Promise<void>) {
  loop().catch((error) => {
    if (!(error instanceof Cancelled) && !scope.cancelled) console.error(error);
  });
}
