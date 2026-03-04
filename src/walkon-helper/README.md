# Walk-on Helper (Go)

Windows helper app that listens to API `gameStateUpdate` events and triggers automation on key page transitions.

## Behavior

On `welcome -> getReady` and `setBreak -> getReadyAgain` transitions:
1. Capture current system volume
2. Fade volume down over 10s (configurable)
3. Kill Qobuz process if running
4. Restore original volume
5. Call `POST /api/game/next` to auto-advance to `intro`

On transition to the **last song before** `setBreak` and to the **last song before** `end` screens:
1. Prelaunch Qobuz (`QOBUZ_LAUNCH_TARGET`) and wait for the Qobuz window
2. Do **not** send `Ctrl+Right` yet

On transition **to** `setBreak` and **to** `end2`:
1. Focus Qobuz
2. Attempt `Ctrl+Right` multiple times to start playback, skipping attempts if the window title already indicates playback, and waiting between failed attempts for app responsiveness
3. For `end2`, optionally fall back to restart-and-play if `QOBUZ_RESTART_ON_END=true`

If any step fails, it logs and leaves manual advance available.

## Environment Variables

- `API_BASE_URL` (default `http://localhost:33001`)
- `SOCKET_URL` (optional; derived from `API_BASE_URL` if omitted)
- `FADE_DOWN_SECONDS` (default `2`)
- `FADE_DOWN_TARGET` (default `0.0`, range `0..1`)
- `QOBUZ_PROCESS_NAMES` (default `Qobuz.exe`, comma-separated list supported)
- `QOBUZ_LAUNCH_TARGET` (default empty: resolves `%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs` and uses a `*.lnk` containing `qobuz`; falls back to `qobuz://`)
- `QOBUZ_WINDOW_WAIT_SECONDS` (default `15`)
- `QOBUZ_FOCUS_TIMEOUT_SECONDS` (default `10`)
- `QOBUZ_PLAYBACK_VERIFY_TIMEOUT_SECONDS` (default `6`)
- `QOBUZ_CHECK_TIMEOUT_SECONDS` (default `8`)
- `QOBUZ_TITLE_CHANGE_TIMEOUT_SECONDS` (legacy fallback; still honored)
- `QOBUZ_WINDOW_POLL_MS` (default `250`)
- `QOBUZ_PLAYBACK_START_MAX_ATTEMPTS` (default `8`)
- `QOBUZ_PLAYBACK_RETRY_MIN_DELAY_MS` (default `800`)
- `QOBUZ_FOCUS_STEP_DELAY_MS` (default `80`)
- `QOBUZ_FOCUS_VERIFY_DELAY_MS` (default `120`)
- `QOBUZ_KEY_SHORT_DELAY_MS` (default `20`)
- `QOBUZ_KEY_LONG_DELAY_MS` (default `40`)
- `QOBUZ_RESTART_ON_END` (default `true`)
- `TRIGGER_COOLDOWN_SECONDS` (default `8`)
- `RECONNECT_SECONDS` (default `2`)
- `HTTP_TIMEOUT_SECONDS` (default `5`)
- `KILL_SETTLE_MS` (default `150`)

## Build

From `src/walkon-helper`:

```bash
go mod tidy
go build -o walkon-helper.exe .
```

Cross-compile from Linux/macOS for Windows:

```bash
GOOS=windows GOARCH=amd64 go build -o walkon-helper.exe .
```

## Run

```bash
./walkon-helper.exe
```

## Notes

- Volume control in this implementation is Windows-only.
- Socket.IO is consumed via Engine.IO websocket frames (`EIO=4`).
- The helper seeds initial state from `/api/game/current` to reduce reconnect duplicate triggers.
