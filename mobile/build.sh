#!/bin/bash

set -e

PLATFORM=$1

if [ -z "$PLATFORM" ]; then
  echo "Usage: ./build.sh [android|ios]"
  exit 1
fi

# ─── Android ────────────────────────────────────────────────────────────────
if [ "$PLATFORM" = "android" ]; then

  echo "→ Switching to Java 17..."
  source "$HOME/.sdkman/bin/sdkman-init.sh" && sdk use java 17.0.10-tem

  echo "→ Running expo prebuild..."
  npx expo prebuild --platform android --clean

  echo "→ Patching signing config and build flags..."
  python3 - <<'PYEOF'
# ── Patch build.gradle: signing config ──────────────────────────────────────
with open('android/app/build.gradle', 'r') as f:
    content = f.read()

release_block = """
        release {
            storeFile file('../../../keys/bestcar-release.keystore')
            storePassword 'bestcar2024'
            keyAlias 'bestcar-key'
            keyPassword 'bestcar2024'
        }"""

# Inject release signing config before closing brace of signingConfigs
content = content.replace(
    "        }\n    }\n    buildTypes {",
    "        }" + release_block + "\n    }\n    buildTypes {"
)

# Use release signing in release buildType
content = content.replace(
    "            signingConfig signingConfigs.debug\n            def enableShrinkResources",
    "            signingConfig signingConfigs.release\n            def enableShrinkResources"
)

with open('android/app/build.gradle', 'w') as f:
    f.write(content)

# ── Patch gradle.properties: enable R8, shrink resources, arm-only ───────────
with open('android/gradle.properties', 'r') as f:
    props = f.read()

replacements = {
    # Enable R8 minification (replaces ProGuard)
    'android.enableMinifyInReleaseBuilds=false': 'android.enableMinifyInReleaseBuilds=true',
    # Enable resource shrinking
    'android.enableShrinkResourcesInReleaseBuilds=false': 'android.enableShrinkResourcesInReleaseBuilds=true',
    # Strip x86/x86_64 (emulator only) — Play Store delivers the right ABI anyway
    'reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64': 'reactNativeArchitectures=armeabi-v7a,arm64-v8a',
}

for old, new in replacements.items():
    props = props.replace(old, new)

# Append flags if they weren't already present
if 'android.enableMinifyInReleaseBuilds' not in props:
    props += '\nandroid.enableMinifyInReleaseBuilds=true'
if 'android.enableShrinkResourcesInReleaseBuilds' not in props:
    props += '\nandroid.enableShrinkResourcesInReleaseBuilds=true'

with open('android/gradle.properties', 'w') as f:
    f.write(props)

PYEOF

  echo "→ Building release AAB..."
  cd android && ./gradlew bundleRelease

  AAB="app/build/outputs/bundle/release/app-release.aab"
  echo ""
  echo "✓ Build successful"
  echo "  Output: mobile/android/$AAB"

# ─── iOS ────────────────────────────────────────────────────────────────────
elif [ "$PLATFORM" = "ios" ]; then

  echo "→ Running expo prebuild..."
  npx expo prebuild --platform ios --clean

  echo "→ Installing CocoaPods..."
  cd ios && pod install && cd ..

  WORKSPACE=$(ls -d ios/*.xcworkspace | head -1)
  SCHEME=$(basename "$WORKSPACE" .xcworkspace)
  ARCHIVE_PATH="ios/build/$SCHEME.xcarchive"
  EXPORT_PATH="ios/build/export"

  echo "→ Archiving ($SCHEME)..."
  xcodebuild \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration Release \
    -archivePath "$ARCHIVE_PATH" \
    -destination "generic/platform=iOS" \
    -allowProvisioningUpdates \
    DEVELOPMENT_TEAM=28734NKN95 \
    CODE_SIGN_STYLE=Automatic \
    archive

  echo "→ Exporting IPA..."
  xcodebuild \
    -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportOptionsPlist ExportOptions.plist \
    -exportPath "$EXPORT_PATH"

  echo ""
  echo "✓ Build successful"
  echo "  Output: mobile/$EXPORT_PATH/$SCHEME.ipa"

else
  echo "Unknown platform: $PLATFORM"
  echo "Usage: ./build.sh [android|ios]"
  exit 1
fi
