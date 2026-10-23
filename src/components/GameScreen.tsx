import * as Brightness from 'expo-brightness';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Dimensions,
  type GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { resumeAudio, stopAll, suspendAudio } from '@/audio/engine';
import { BRIGHTNESS, LUZ, SLEEP, START_DELAY_MS } from '@/config';
import { Cancelled, Scope } from '@/games/scope';
import type { Game, GameHandlers, TouchPoint } from '@/games/types';
import { colors } from '@/theme';

const KEEP_AWAKE_TAG = 'game';

interface Finger extends TouchPoint {
  x: number;
  /** Última posición desde la que el dedo se movió de verdad. */
  stillX: number;
  stillY: number;
  stillSince: number;
}

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

/**
 * Pantalla negra de juego. Toda la pantalla es zona táctil (se juega con los ojos cerrados).
 * Se encarga de lo común a todos los juegos: mantener la pantalla encendida mientras se juega,
 * el brillo, y detectar que la persona se durmió para apagar todo.
 */
export function GameScreen({ game }: { game: Game }) {
  const insets = useSafeAreaInsets();
  const [light] = useState(() => new Animated.Value(0));
  const handlers = useRef<GameHandlers>({});
  const finger = useRef<Finger | null>(null);
  const lastActivity = useRef(0);

  useEffect(() => {
    const scope = new Scope();
    let ended = false;
    let left = false;
    let guard: ReturnType<typeof setInterval> | undefined;

    // Las llamadas de brillo son asíncronas: se encadenan para que no se pisen.
    let brightnessQueue: Promise<unknown> = Promise.resolve();
    const brightness = (task: () => Promise<unknown>) => {
      brightnessQueue = brightnessQueue.then(task).catch(() => {});
    };
    let savedBrightness: number | null = null;
    brightness(async () => {
      savedBrightness = await Brightness.getBrightnessAsync();
    });
    brightness(() => Brightness.setBrightnessAsync(BRIGHTNESS.dark));
    const restoreBrightness = () =>
      brightness(async () => {
        if (Platform.OS === 'android') await Brightness.restoreSystemBrightnessAsync();
        else if (savedBrightness !== null) await Brightness.setBrightnessAsync(savedBrightness);
      });

    const setLight = (on: boolean) => {
      if (ended) return;
      brightness(() => Brightness.setBrightnessAsync(on ? BRIGHTNESS.light : BRIGHTNESS.dark));
      Animated.timing(light, {
        toValue: on ? 1 : 0,
        duration: on ? LUZ.fadeInMs : 150,
        useNativeDriver: true,
      }).start();
    };

    /** Corta el juego y el sonido. Devuelve false si ya estaba terminado. */
    const end = (fadeSec: number) => {
      if (ended) return false;
      ended = true;
      scope.cancel();
      handlers.current = {};
      clearInterval(guard);
      stopAll(fadeSec);
      suspendAudio(fadeSec * 1000 + 300);
      // Sin keep-awake, el sistema apaga y bloquea la pantalla con su tiempo de espera normal.
      deactivateKeepAwake(KEEP_AWAKE_TAG);
      return true;
    };

    const fallAsleep = () => {
      if (!end(SLEEP.fadeOutMs / 1000)) return;
      light.setValue(0);
      brightness(() => Brightness.setBrightnessAsync(0));
    };

    // Dedo quieto mucho tiempo, o nadie toca la pantalla hace rato: se durmió.
    guard = setInterval(() => {
      const t = Date.now();
      const f = finger.current;
      if (f ? t - f.stillSince > SLEEP.stillMs : t - lastActivity.current > SLEEP.inactivityMs) {
        fallAsleep();
      }
    }, 1000);

    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        end(0.1);
        restoreBrightness();
      } else if (state === 'active' && ended && !left) {
        // Al volver a la app (por ejemplo, al desbloquear a la mañana), al menú.
        left = true;
        leave();
      }
    });

    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    lastActivity.current = Date.now();

    (async () => {
      await resumeAudio();
      await scope.wait(START_DELAY_MS);
      handlers.current = game({
        scope,
        height: Dimensions.get('window').height,
        setLight,
        fallAsleep,
        finger: () => (finger.current ? { y: finger.current.y, t: finger.current.t } : null),
      });
    })().catch((error) => {
      if (!(error instanceof Cancelled)) console.error(error);
    });

    return () => {
      appState.remove();
      // Si salió durante el fundido de "se durmió", cortar más rápido.
      if (!end(0.15)) stopAll(0.15);
      restoreBrightness();
    };
  }, [game, light]);

  const point = (e: GestureResponderEvent) => ({
    x: e.nativeEvent.pageX,
    y: e.nativeEvent.pageY,
    t: Date.now(),
  });

  const onDown = (e: GestureResponderEvent) => {
    const { x, y, t } = point(e);
    lastActivity.current = t;
    finger.current = { x, y, t, stillX: x, stillY: y, stillSince: t };
    handlers.current.onDown?.({ y, t });
  };

  const onMove = (e: GestureResponderEvent) => {
    const f = finger.current;
    if (!f) return;
    const { x, y, t } = point(e);
    lastActivity.current = t;
    Object.assign(f, { x, y, t });
    if (Math.hypot(x - f.stillX, y - f.stillY) > SLEEP.stillTolerancePx) {
      Object.assign(f, { stillX: x, stillY: y, stillSince: t });
    }
    handlers.current.onMove?.({ y, t });
  };

  const onUp = (e: GestureResponderEvent) => {
    const { y, t } = point(e);
    lastActivity.current = t;
    finger.current = null;
    handlers.current.onUp?.({ y, t });
  };

  return (
    <View style={styles.screen}>
      <StatusBar hidden />
      <Animated.View pointerEvents="none" style={[styles.light, { opacity: light }]} />
      <View
        style={StyleSheet.absoluteFill}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={onDown}
        onResponderMove={onMove}
        onResponderRelease={onUp}
        onResponderTerminate={onUp}
      />
      <Pressable
        onPress={leave}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Salir"
        style={[styles.exit, { top: insets.top + 8 }]}
      >
        <Text style={styles.exitText}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  light: {
    position: 'absolute',
    inset: 0,
    backgroundColor: colors.light,
  },
  exit: {
    position: 'absolute',
    left: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitText: {
    color: colors.exit,
    fontSize: 28,
    lineHeight: 32,
  },
});
