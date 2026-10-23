# Duermevela

Juegos con los ojos cerrados para conciliar el sueño. Todo es sonido y tacto: la pantalla
queda negra, toda ella es zona táctil, y cuando la app detecta que te dormiste corta el
sonido y deja que el teléfono se apague.

## Juegos

| Juego | Qué pasa | Qué hacés |
| --- | --- | --- |
| **Imitar** | Suena un tono vibrante de 3 s que sube, baja, sube y baja, o baja y sube. | Lo repetís con el dedo, como un instrumento: el tono sigue a tu dedo (arriba = agudo). |
| **Luz** | Un zumbido grave de fondo. Después de 8–25 s la pantalla se pone blanca. | Cuando notás la luz a través de los párpados, tocás. Vuelve a negro y espera de nuevo. |
| **Contar** | Suenan de 1 a 5 vibraciones. | Tocás la pantalla la misma cantidad de veces. Cada toque hace un "tic" suave. |
| **Sostener** | Un tono de referencia que después empieza a desafinarse. | Lo mantenés en el mismo tono: si se agudiza, bajás el dedo; si se pone grave, lo subís. |

Al acertar suenan dos notas suaves que suben. Al errar, una nota grave que cae apenas.
Las rondas se repiten solas. Para salir: la **×** tenue arriba a la izquierda, el gesto
de volver atrás, o salir de la app.

## Detección de sueño

La app da por hecho que te dormiste si pasa alguna de estas cosas:

- el dedo queda apoyado y quieto 15 s;
- no tocás la pantalla durante 2 minutos;
- en **Luz**, la pantalla blanca nadie la toca en 12 s.

Ahí el sonido se apaga con un fundido de 4 s, la pantalla queda negra con el brillo al
mínimo y se libera el "mantener encendida". El teléfono se bloquea con su tiempo de
autobloqueo normal. Al desbloquearlo, la app vuelve al menú.

> **Nota:** ni iOS ni Android dejan que una app común bloquee el teléfono por su cuenta.
> En Android haría falta pedir permiso de "administrador del dispositivo", lo que no vale
> la pena para esto. Igual, con pantalla negra, brillo en 0 y el audio pausado, el consumo
> es casi nulo hasta que se bloquea solo.

## Sobre los 4.000–7.000 Hz

Las ondas cerebrales de la somnolencia y el sueño liviano (theta) van de **4 a 7 Hz**, no
de 4.000 a 7.000. Un tono de 4.000 Hz es un pitido agudo, tipo mosquito, que despierta.
Además, 4–7 Hz está por debajo de lo que el oído percibe como tono.

Por eso la app usa esa frecuencia como **velocidad de la vibración**: cada sonido es un
tono grave y suave (180–900 Hz) cuyo volumen late de 4 a 7 veces por segundo. Suena
justamente como una vibración. Si querés probar otros valores, están en `src/config.ts`
(`VIBRATION_HZ` y `PITCH_HZ`).

## Cómo correrlo

Usa síntesis de audio en tiempo real (`react-native-audio-api`), que es código nativo, así
que **no funciona en Expo Go**: hace falta una *development build*.

Requisitos: Node 22 o más nuevo (`nvm use` toma la versión del `.nvmrc`), y además:

- **Android:** Android Studio (SDK y JDK 17).
- **iOS:** **Xcode 26 o más nuevo** (Expo SDK 58 necesita Swift 6.2) y CocoaPods 1.15 o más nuevo.

Para no instalar nada de eso, se puede compilar en la nube con EAS (la primera vez te
pregunta lo necesario y crea `eas.json`).

```bash
nvm use
npm install

npx expo run:android   # emulador o teléfono Android conectado
npx expo run:ios       # simulador de iOS o iPhone conectado

# Sin Xcode ni Android Studio, compilando en la nube:
npx eas-cli@latest build --profile development --platform android
```

### APK para instalar en un Android

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a
# → android/app/build/outputs/apk/release/app-release.apk
```

Sirve para probar, no para Play Store, porque está firmado con la clave de debug.

### AAB para Google Play

```bash
nvm use
./scripts/build-aab.sh
# → android/app/build/outputs/bundle/release/app-release.aab
```

Regenera `android/` desde `app.json` y firma con la clave de subida, que vive fuera del repo
en `~/keystores/duermevela-upload.properties` (o donde indique `DUERMEVELA_UPLOAD_PROPERTIES`).
Antes de cada versión nueva, subí `android.versionCode` en `app.json`.

Los textos y gráficos de la ficha de Play están en `store/`, y la web con la política de
privacidad en `docs/` (GitHub Pages).

Las carpetas `ios/` y `android/` se generan solas y no se versionan. Lo nativo se configura
en `app.json`.

Para probar de verdad conviene un teléfono físico: en el simulador no se nota la luz ni se
siente el tacto, y los parlantes de la computadora suenan distinto.

### Errores conocidos en iOS

- `pod install` falla con ``undefined method `split' for #<Array>``: CocoaPods demasiado
  viejo (1.13 con el Ruby 2.6 del sistema). Actualizalo, por ejemplo con
  `brew install cocoapods`, y volvé a correr el comando.
- `package 'apple' is using Swift tools version 6.2.0 but the installed version is 6.1.0`:
  hace falta Xcode 26 o más nuevo.

## Ajustes

Todo lo que se puede ajustar está en `src/config.ts`: tiempos, rangos de tono, velocidad
de vibración, umbrales de detección de sueño, brillo y dificultad de cada juego.

## Estructura

```
src/
  app/                 Pantallas (Expo Router): menú y un archivo por juego
  components/
    GameScreen.tsx     Pantalla negra común: toques, sueño, brillo, keep-awake, salida
  games/               Lógica de cada juego, sin interfaz
    contour.ts         Formas del juego Imitar y comparación con el trazo del dedo
    scope.ts           Esperas cancelables (para cortar el juego en cualquier momento)
  audio/
    engine.ts          Motor de sonido: tonos que vibran, deslizamientos y fundidos
    sounds.ts          Sonidos de acierto, error y toque
  config.ts            Valores ajustables
  theme.ts             Colores de noche
```
