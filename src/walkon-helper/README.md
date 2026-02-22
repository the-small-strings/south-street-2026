# Walk-on Helper (Go)

Windows helper app that listens to API `gameStateUpdate` events and triggers the walk-on prep automation when state moves forward from `welcome` to `walkOnPrep`.

## Behavior

On `welcome -> walkOnPrep` transition:
1. Capture current system volume
2. Fade volume down over 2s (configurable)
3. Kill Qobuz process if running
4. Restore original volume
5. Call `POST /api/game/next` to auto-advance to `intro`

If any step fails, it logs and leaves manual advance available.

## Environment Variables

- `API_BASE_URL` (default `http://localhost:33001`)
- `SOCKET_URL` (optional; derived from `API_BASE_URL` if omitted)
- `FADE_DOWN_SECONDS` (default `2`)
- `FADE_DOWN_TARGET` (default `0.0`, range `0..1`)
- `QOBUZ_PROCESS_NAMES` (default `Qobuz.exe`, comma-separated list supported)
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
