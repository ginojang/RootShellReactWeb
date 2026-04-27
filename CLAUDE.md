# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server on port 5173 (host 0.0.0.0, polling watch for WSL)
npm run build        # tsc -b && vite build
npm run lint         # ESLint
npm run preview      # Preview production build
npm run version:update  # Sync VITE_APP_VERSION in .env from package.json version
```

No test framework is configured.

## Architecture Overview

This is **Punker** — a React/TypeScript web shell that wraps a Unity WebGL game. React owns the auth flow and UI overlay; Unity owns the game rendering. They communicate over a bidirectional message bridge.

### Startup & Page Flow

```
main.tsx → App.tsx (InitGlobalEnv) → PureUnityWebView
  └── UnityProvider (React Context)
       └── PureUnityWebViewInner (state machine)
             ├── EmptySplashBackground  (always rendered, triggers onReady)
             ├── BlueScreenSplash       (error/unsupported states)
             ├── LandingPage            (MetaMask wallet connect + NFT holder check)
             ├── HolderPage             (displays holder/store info post-auth)
             └── UnityWrapper           (loads Unity WASM build, shown after auth)
```

`EmptySplashBackground` fires `onReady` on mount, which runs environment checks (Kakao in-app browser, iOS < 17 = blocked). On success, `LandingPage` is shown. After wallet auth + NFT holder verification, `HolderPage` is shown and `GameMainLoop` runs once to generate a UUID, then Unity starts.

`ReactUICanvas` (z-index 1000) and `DebugOverlay` (z-index 10000) are always rendered on top of Unity.

### Unity ↔ React Message Bridge

**Unity → React**: Unity calls the global `window.onRecvUnityMessge(msg)` which pushes into `unityMessageQueueRef`. `UnityWrapper` drains the queue on a 100 ms interval, dispatching to `unityMessageHandlers` by message `type`.

Messages from Unity are **XOR-encrypted Base64** using the key `'34!@#A-Tension@RootLink_'`. Decryption happens in `handleUnityMessage` inside `UnityMessageHandler.ts`.

**React → Unity**: `sendUnityMessage(id, type, result, data?)` calls `window.unityInstance.SendMessage('RootShellBridge', 'RecvMessgeFromRootShell', ...)`. Direct (unprompted) messages use `sendUnityMessageDirect`.

**Handshake**: After Unity signals `window.onUnityReady()` and React finishes loading, `UnityWrapper` sends `OnReactReady` to Unity's `RootShellBridge` with `{ startMode, userUUID, language, isMobile, version, os }`.

**Unity build assets** are expected at `./UnityBuild/Punker/Build/` (relative to the served root).

### Adding a New Unity Message Handler

1. Add the type name to `UnityMessageTypes` in `UnityMessageHandler.ts`
2. Write a handler function `(payload, id?) => void`
3. Register it in `unityMessageHandlers`
4. If it responds to Unity, call `sendUnityMessage(id, 'OnXxxAck', true, data)`

### ReactUICanvas — Imperative UI Layer

`ReactUICanvas` uses module-level setter refs (`externalShowLoadingSpinner`, `externalShowPopup`, etc.) to allow non-React code (handlers, GameMainLoop) to trigger UI imperatively. Call the exported helpers:

```ts
showLoadingSpinner({ loading: true, message: '...' })
showOkayPopup(title, content, onOkay)
showYesNoPopup(title, content, onYes, onNo)
showListViewPopup(title, items, align, onOkay)
showOverlayPopup(<MyComponent />)  // arbitrary React node
```

### Audio System

Unity sends `loadAudioClip` and `executeAudioAction` messages. `AudioManager` handles these by delegating to `AudioRegistry`, which manages `HTMLAudioElement` instances keyed by opaque handle strings. Audio files are fetched as OGG from `https://ninja.o2jam.com/audio/game/{fileName}.ogg`. When the page is hidden, Unity BGM is paused and HTML audio is muted via a `visibilitychange` listener in `UnityWrapper`.

### Utility Conventions

**All util and API functions return `string | null` or `Promise<string>`, never objects, never throw.** This is an explicit cross-platform constraint so the same code can be called from Unity C# bridge layers. Errors are returned as JSON strings `{"error":true,"message":"..."}`. Use `isApiSuccess(raw)` in `sendApi.ts` to parse results.

**LocalStorage** (`localStorage.ts`): plain save/load (`saveToLocal`/`loadFromLocal`) and AES-CBC encrypted variants (`saveToLocalCryptoAsync`/`loadFromLocalCryptoAsync`). Unity game data is stored under a per-session UUID as the folder prefix.

**Logging** (`log.ts`): use `log()`, `logSuccess()`, `logWarn()`, `logError()` — never `console.log` directly. These prepend tagged timestamps for filtering in the console.

### i18n

`getText(key)` in `src/i18n/index.ts` reads from `texts.json` keyed by `ko | en | ja`. Language is persisted in `localStorage` as `user_language` and loaded in `InitGlobalEnv`. Changing the language also hot-swaps the CSS font (Korean/English → MaplestoryBold, Japanese → MPLUSRounded1cBold).

### Environment Variables (`.env`)

| Key | Purpose |
|---|---|
| `VITE_APP_TYPE` | `pure_unity` or `web_app` |
| `VITE_PC_WIDTH` / `VITE_PC_HEIGHT` | Unity canvas fixed size on desktop (default 1120×600) |
| `VITE_ROOT_SHELL_4_API_BASE_URL` | Backend API base URL |
| `VITE_APP_LOADING_UI_MIN_TIME` | Minimum loading UI display time (ms) |
| `VITE_APP_VERSION` | Managed by `npm run version:update`, injected into HTML and sent to Unity on handshake |
| `VITE_EXIT_URL` | URL navigated to when the user exits the app |
| `VITE_KAIA_SIGNATURE_MESSAGE` | **Do not change** — used for blockchain signing on the backend |

### Three.js

`ThreeJsCanvas` and `setupThree.ts` provide a purely visual background layer (fractal nebula + cosmic particles + Unreal bloom). It is used in splash/loading screens and is independent of the Unity bridge.
