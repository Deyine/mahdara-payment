# Android Release Signing

## Keystore Info

| Field          | Value                                           |
|----------------|-------------------------------------------------|
| File           | `keys/bestcar-release.keystore` (project root)  |
| Store password | `bestcar2024`                                   |
| Key alias      | `bestcar-key`                                   |
| Key password   | `bestcar2024`                                   |
| Algorithm      | RSA 2048-bit                                    |
| Validity       | 10 000 days                                     |

## Build Output

| Field       | Value                                               |
|-------------|-----------------------------------------------------|
| Format      | AAB (Android App Bundle)                            |
| Package     | `com.nv.bestcar`                                    |
| Version     | 1.0.0 (versionCode: 1)                              |
| Output path | `android/app/build/outputs/bundle/release/app-release.aab`  |

## Rebuild

```bash
cd mobile

# Switch to Java 17
source "$HOME/.sdkman/bin/sdkman-init.sh" && sdk use java 17.0.10-tem

# Full build (prebuild + gradle)
./build.sh android
```

> **Keep the keystore file backed up.** Losing it means you can never update the app on the Play Store.
> The keystore is gitignored — store it somewhere safe (password manager, external backup).
