#!/usr/bin/env bash
# Genera el .aab para Google Play, firmado con la clave de subida.
#
# La clave vive fuera del repo. Por defecto se lee de ~/keystores/duermevela-upload.properties
# (storeFile, storePassword, keyAlias, keyPassword); se puede usar otra con
# DUERMEVELA_UPLOAD_PROPERTIES=/ruta/al/archivo.properties.
#
# Resultado: android/app/build/outputs/bundle/release/app-release.aab
set -euo pipefail
cd "$(dirname "$0")/.."

PROPS="${DUERMEVELA_UPLOAD_PROPERTIES:-$HOME/keystores/duermevela-upload.properties}"
[ -f "$PROPS" ] || { echo "No encuentro $PROPS" >&2; exit 1; }
prop() { grep "^$1=" "$PROPS" | cut -d= -f2-; }

# android/ se regenera desde app.json (CNG), así que siempre refleja la config actual.
EXPO_NO_GIT_STATUS=1 npx expo prebuild --platform android --clean

cd android
./gradlew bundleRelease \
  -Pandroid.injected.signing.store.file="$(prop storeFile)" \
  -Pandroid.injected.signing.store.password="$(prop storePassword)" \
  -Pandroid.injected.signing.key.alias="$(prop keyAlias)" \
  -Pandroid.injected.signing.key.password="$(prop keyPassword)"

echo
echo "Listo: $(pwd)/app/build/outputs/bundle/release/app-release.aab"
