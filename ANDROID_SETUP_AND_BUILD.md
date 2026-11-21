# NER-MIND Android Mobile Application & APK Build Guide

This project has been converted into a native **Android Mobile Application** using **Capacitor**, preserving all existing games, dementia-friendly features, caretaker tools, bilingual audio/TTS, and offline storage.

---

## 📱 What Was Done

1. **Capacitor Integration**:
   - Installed `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/app`, `@capacitor/status-bar`, and `@capacitor/screen-orientation`.
   - Created `packages/patient-app/capacitor.config.ts` with package ID `org.nermind.patientapp` and app name `NER-MIND Dementia Care`.
   - Generated native Android project in `packages/patient-app/android/`.

2. **Dementia-Friendly Android Enhancements**:
   - **Hardware Back Button Handling**: Hierarchical back-button navigation in `App.tsx`:
     1. Closes open modals/drawers (Voice, Settings, Help, Logout, Emergency).
     2. Exits active game or cognitive session back to the menu.
     3. Returns from Caretaker/Healthcare portals to the Patient home screen.
     4. Navigates back from sub-tabs (Activities, Reminders, Progress) to Home.
     5. Only exits the app when on the main Home dashboard.
   - **Portrait Lock**: Locks screen orientation to portrait (`android:screenOrientation="portrait"`) to prevent disorienting rotations for elderly users.
   - **Edge-to-Edge & Mobile Touch**: Viewport configured with `maximum-scale=1.0, user-scalable=no, viewport-fit=cover` to eliminate accidental touch zooms while playing games.
   - **Required Permissions Configured** (`AndroidManifest.xml`):
     - `android.permission.RECORD_AUDIO` & `MODIFY_AUDIO_SETTINGS` (voice guidance & speech interaction)
     - `android.permission.CAMERA` & `READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE` (caretaker photo uploads for family & object recognition games)
     - `android.permission.INTERNET` (offline-first sync worker)

3. **100% Offline-First Architecture**:
   - Web assets bundled directly inside the APK (`android/app/src/main/assets/public`).
   - Runs with zero external internet required.
   - IndexedDB local storage persists games, patient profiles, activity schedules, and reminders.

---

## 🚀 How to Build and Run the APK

### Prerequisites
- **Android Studio** (installed at `C:\Program Files\Android\Android Studio\bin\studio64.exe`)
- **Java 21 LTS** (already configured on your machine)
- **Android SDK** (located at `%LOCALAPPDATA%\Android\Sdk`)

---

### Option 1: Open in Android Studio (Recommended)

Run the following command from the root folder:

```powershell
npm run cap:open
```

Or manually open the folder:
```
C:\Users\DELL\Desktop\ner-mind-offline-ai-main\packages\patient-app\android
```
in **Android Studio**.

#### In Android Studio:
1. Allow Gradle to sync dependencies automatically.
2. Connect your Android smartphone or tablet via USB (enable **USB Debugging** in Developer Options), or select an Android Emulator.
3. Click the green **Run (▶)** button or press `Shift + F10`.
4. The app will install and open immediately on your device.

#### To Generate an Installable APK (.apk file):
1. In the top menu, go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
2. Once the build finishes, a notification will appear: `"APK(s) generated successfully"`.
3. Click **locate** to view the debug APK:
   ```
   packages/patient-app/android/app/build/outputs/apk/debug/app-debug.apk
   ```
4. Transfer this `.apk` file to any Android phone or tablet via USB, WhatsApp, or Google Drive, and tap to install!

---

### Option 2: Build APK via Terminal / Gradle

Whenever you make changes to games or UI, rebuild and sync with one command:

```powershell
npm run build:android
```

Then build the debug APK using the Gradle wrapper:

```powershell
cd packages/patient-app/android
.\gradlew assembleDebug
```

The output APK will be generated at:
```
packages/patient-app/android/app/build/outputs/apk/debug/app-debug.apk
```

---

### 📦 Installing onto Your Android Device via ADB

If your device is connected via USB:

```powershell
adb install -r packages/patient-app/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🎮 Included Games & Modules in Android Build

1. **Shape Finding Game** (Visual-spatial search)
2. **Simple Jigsaw Puzzle** (Visuospatial orientation & touch-friendly piece placement)
3. **Picture Recognition Game** (Semantic & visual recognition)
4. **Color Sorting Game** (Executive function & categorized motor tapping)
5. **Word Arrange Game / WittyWords** (Language & verbal memory)
6. **Identify Person & Family Member Identification Game** (Facial recognition with custom caretaker photos)
7. **Personal Recognition Game** (Familiar objects & personal history memory)
8. **Memory Shopping Recall** (Short-term working memory)
9. **Sequencing Tea Routine** (Procedural memory & everyday habit sequence)
10. **Real-Life Daily Care Timeline & Smart Reminders** (Medication safety, water drinking, daily activities)
11. **Caretaker Management Portal** (Upload custom family photos, configure difficulty, monitor cognitive resilience index)

cd C:\Users\DELL\Desktop\ner-mind-offline-ai-main
npm run --workspace=@ner-mind/patient-app dev -- --host 0.0.0.0