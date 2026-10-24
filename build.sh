#!/usr/bin/env bash
# Gradle-free build: aapt2 compile -> link -> javac -> jar -> d8 -> zip -> zipalign -> apksigner
set -euo pipefail
cd "$(dirname "$0")"

# Paths follow the standard Android SDK layout; override any of them with env vars.
SDK=${SDK:-${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}}}
BT=${BT:-$SDK/build-tools/34.0.0}
AJ=${AJ:-$SDK/platforms/android-34/android.jar}
R8_VERSION=${R8_VERSION:-8.13.23}
R8_JAR=${R8_JAR:-.tools/r8-$R8_VERSION.jar}
# Signing: keep the keystore out of git. A demo key is generated on first build if none exists.
KS=${KS:-keystore/questdemo.jks}
KS_ALIAS=${KS_ALIAS:-questdemo}
KS_PASS=${KS_PASS:-grinda-quest}
VERSION=1.0.0
VCODE=1
OUT=build
DIST=dist
APK=$DIST/QuestDemo-$VERSION.apk

for f in "$BT/aapt2" "$BT/zipalign" "$BT/apksigner" "$AJ"; do
  [ -e "$f" ] || { echo "missing $f (install build-tools;34.0.0 and platforms;android-34, or set SDK/BT/AJ)"; exit 1; }
done
if [ ! -f "$R8_JAR" ]; then
  echo "== fetch D8/R8 $R8_VERSION"
  mkdir -p "$(dirname "$R8_JAR")"
  curl -fsSL -o "$R8_JAR" "https://dl.google.com/dl/android/maven2/com/android/tools/r8/$R8_VERSION/r8-$R8_VERSION.jar"
fi
if [ ! -f "$KS" ]; then
  echo "== generate demo keystore $KS"
  mkdir -p "$(dirname "$KS")"
  keytool -genkeypair -keystore "$KS" -alias "$KS_ALIAS" -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$KS_PASS" -keypass "$KS_PASS" -dname "CN=Quest Demo, O=Demo, C=KR"
fi

rm -rf "$OUT"; mkdir -p "$OUT"/{res,classes,dex,gen,apk,assets/www} "$DIST"

echo "== assets"
cp -r web/index.html web/css web/js web/fonts "$OUT/assets/www/"

echo "== aapt2 compile"
"$BT/aapt2" compile --dir android/res -o "$OUT/res/compiled.zip"

echo "== aapt2 link"
"$BT/aapt2" link -I "$AJ" \
  --manifest android/AndroidManifest.xml \
  --min-sdk-version 26 --target-sdk-version 34 \
  --version-code $VCODE --version-name $VERSION \
  -A "$OUT/assets" --java "$OUT/gen" \
  -o "$OUT/apk/base.apk" "$OUT/res/compiled.zip"

echo "== javac"
javac --release 17 -XDstringConcat=inline -Werror -Xlint:all,-deprecation,-options -encoding UTF-8 \
  -classpath "$AJ" -d "$OUT/classes" $(find android/java "$OUT/gen" -name '*.java')

echo "== d8"
(cd "$OUT/classes" && jar cf ../classes.jar .)
java -cp "$R8_JAR" com.android.tools.r8.D8 --release --min-api 26 --lib "$AJ" --output "$OUT/dex" "$OUT/classes.jar"

echo "== package"
cp "$OUT/apk/base.apk" "$OUT/apk/unsigned.apk"
(cd "$OUT/dex" && zip -q -j ../apk/unsigned.apk classes.dex)
"$BT/zipalign" -p -f 4 "$OUT/apk/unsigned.apk" "$OUT/apk/aligned.apk"

echo "== sign"
export KS_PASS
"$BT/apksigner" sign --ks "$KS" --ks-key-alias "$KS_ALIAS" \
  --ks-pass env:KS_PASS --key-pass env:KS_PASS \
  --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true \
  --out "$APK" "$OUT/apk/aligned.apk"

echo "== verify"
"$BT/apksigner" verify --verbose "$APK" | head -6
"$BT/zipalign" -c -p 4 "$APK" && echo "zipalign OK"
ls -la "$APK"
