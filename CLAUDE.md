# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server on port 3000 (required by KAIA SDK)
npm run build        # TypeScript check + Vite production build → dist/
npm run lint         # ESLint with TypeScript support
npm run preview      # Preview the production build
npm run version:update  # Bump version across config files
```

No test framework is configured. There are no test files.

## App Architecture

This is a **React 19 + Vite + TypeScript** web app that embeds a Unity WebGL game ("O2Jam Ninja") with blockchain payment and LINE social integration. The app has three deployment modes controlled by `VITE_APP_TYPE`:

| Mode | File | Description |
|------|------|-------------|
| `pure_unity` | `appServices/PureUnityWebView.tsx` | Standalone Unity WebGL only |
| `dapp_unity_web` | `appServices/dAppUnityWeb.tsx` | Unity + KAIA blockchain wallet |
| `line_unity_web` | `appServices/lineUnityWeb.tsx` | Unity + KAIA wallet + LINE LIFF |

`src/App.tsx` switches between modes. Each mode wraps children with its needed providers before mounting `UnityWrapper`.

## Unity Integration

**Message flow**: Unity ↔ React communicate via XOR-encrypted, Base64-encoded JSON. The cipher key is `34!@#A-Tension@RootLink_` (defined in `UnityMessageHandler.ts`).

- `providers/unity/UnityProvider.tsx` — React Context holding `unityInstanceRef`, `handshakeDone`, and `unityMessageQueueRef`
- `providers/unity/UnityMessageHandler.ts` — Decrypts incoming Unity messages and routes them to handler functions by `UnityMessageTypes`
- `providers/unity/UnityWrapper.tsx` — Manages Unity lifecycle: handshake, message queue processing (100ms poll), and calls content handlers
- `services/BridgeProvides.ts` — Thin wrapper around `sendUnityMessageDirect()` used by all content modules to reply to Unity

Queue pattern: React queues outbound messages while Unity is loading, then flushes on handshake completion.

## Content Handlers

`src/content/` contains game-domain logic called from `UnityMessageHandler`:

- `O2JamMain.ts` — Core game state (JSON read/write, stage management, wallet info request)
- `O2JamPayment.ts` — Payment flow: `buyItem(mode, itemKey)` handles `'Stripe'`, `'Kaia'`, `'None'` modes with 60s polling (1s intervals) against the backend
- `O2JamPopup.ts` — Maps Unity popup requests to React component renders
- `O2JamWalletUsers.ts` — Wallet-tied user profile management

## Blockchain Integration

- `providers/KaiaWalletProvider.tsx` — Connects `@linenext/dapp-portal-sdk`; chainId `8217` (mainnet) / `1001` (testnet)
- `services/KaiaWallet.ts` — Utilities: `requestAccount()`, `connectAndSign()`, `getBalance()`, `buildMyTranscationToSend()`, `toPeb()`/`fromPeb()` (1 KAIA = 10^18 peb)

**Important**: `VITE_KAIA_SIGNATURE_MESSAGE` must not change — the backend validates this exact string.

## LINE Integration

- `providers/LiffProvider.tsx` — Wraps `@line/liff`; exposes `userId`, `displayName`, `pictureUrl`, `idToken`
- `VITE_APP_IS_FAKE_LIFF=true` enables local dev without real LINE SDK

## API Communication

`utils/sendApi.ts` — `sendApiJson<T>(route, api, payload)` is the single API caller.

- Base URL: `VITE_ROOT_SHELL_4_API_BASE_URL` (defaults to `https://ninja.o2jam.com/api/v1/`)
- Routes: `users`, `auth`, `payment`, `transactions`
- **All functions return `Promise<string>`** (JSON-stringified). Callers must `JSON.parse`. Never throws; errors are JSON strings.
- `isApiSuccess(raw)` checks for `success: true` or `error: false`

## Cross-Platform Conventions

These patterns appear throughout the codebase and should be followed:

1. **Return `string | null`** from all storage/utility functions — never throw, never return parsed objects
2. **Use refs for game-loop state** (`unityInstanceRef`, message queues) to avoid React re-renders in high-frequency paths
3. `utils/localStorage.ts` has both plain (`saveToLocal`/`loadFromLocal`) and AES-encrypted (`saveToLocalCryptoAsync`/`loadFromLocalCryptoAsync`) variants with 8-char keys

## i18n

`i18n/index.ts` exports `getText(key: TextKey)`. Keys (`t001`, `t002`, …) are in `i18n/texts.json` with `{ko, en, ja}` values. Language is detected/persisted via `config/GlobalEnv.ts` → `getLanguage()`/`setLanguage()`.

## GlobalEnv

`src/config/GlobalEnv.ts` detects at startup:
- `isMobile`, `currentOS` (`'ios'|'android'|'etc'`), `currentOSVersion`
- `launchedInApp` (kakao, telegram, line, instagram, …)
- `isSupportedWebGL2`

Blue screen (`pages/default/BlueScreenSplash.tsx`) is shown for iOS < 17 or unsupported Kakao browser.

## Key Environment Variables

```
VITE_APP_TYPE                          # pure_unity | dapp_unity_web | line_unity_web
VITE_KAIA_CLIENT_ID                    # dAPP Portal client ID
VITE_KAIA_CHAIN_ID                     # 8217 (mainnet) | 1001 (testnet)
VITE_KAIA_SIGNATURE_MESSAGE            # Auth signing message — DO NOT CHANGE, backend-coupled
VITE_ROOT_SHELL_4_API_BASE_URL         # Backend API base URL
VITE_LINE_LIFF_ID                      # LINE LIFF app ID
VITE_PORT                              # Must be 3000 (KAIA SDK requirement)
VITE_APP_IS_FAKE_LIFF                  # true for local LINE dev
VITE_APP_VERSION                       # Semver game version
```
