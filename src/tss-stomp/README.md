# tss-stomp

Python application for controlling footswitches and LEDs on a Raspberry Pi, used to control the TSS South Street show.

## Running

Requires [uv](https://docs.astral.sh/uv/) and Python 3.13+.

### From the repository root

```bash
make run-stomp
```

### From the `src/tss-stomp` directory

```bash
USE_MOCK_GPIO=true API_BASE_URL=http://localhost:33001 uv run -m tss_stomp.main
```

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `USE_MOCK_GPIO` | Set to `true` to use mock GPIO pins instead of real hardware (for development without a Raspberry Pi) | `false` |
| `API_BASE_URL` | Base URL of the TSS API server | `http://192.168.123.100:33001` |
