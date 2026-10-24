#!/usr/bin/env bash
# JUnit + Robolectric tests for the WebView shell. Run ./build.sh first.
set -euo pipefail
cd "$(dirname "$0")"
ROOT=$(cd ../.. && pwd)
[ -d lib ] || mvn -q -B dependency:copy-dependencies -DoutputDirectory=lib
for a in lib/*.aar; do [ -e "$a" ] || continue; j="${a%.aar}.jar"; [ -f "$j" ] || unzip -p "$a" classes.jar > "$j"; done
mkdir -p res/com/android/tools out
cat > res/com/android/tools/test_config.properties <<P
android_resource_apk=$ROOT/build/apk/base.apk
android_merged_manifest=$ROOT/android/AndroidManifest.xml
android_merged_assets=$ROOT/build/assets
android_custom_package=com.grinda.questdemo
P
CP="$(ls lib/*.jar | tr '\n' ':')$ROOT/build/classes:res"
javac -encoding UTF-8 -d out -cp "$CP" src/com/grinda/questdemo/*.java
java -Drobolectric.offline=true -Drobolectric.dependency.dir=lib -cp "out:$CP" org.junit.runner.JUnitCore \
  com.grinda.questdemo.MimeTest com.grinda.questdemo.MainActivityTest
