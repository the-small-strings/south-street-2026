# TSS South Street App

## System Architecture

```
                                                                                   
   ┌────────────────────────────────────────────────────────────────────────────┐  
   │                                                                            │  
   │                                                                            │  
   │       LAPTOP                                                               │  
   │                                                                            │  
   │                                                                            │  
   │       ┌─────────────────────────────────────────────────────────────┐      │  
   │       │                                                             │      │  
   │       │    Browser                                                  │      │  
   │       │                                                             │      │  
   │       │   ┌───────────────┐    ┌───────────────────┐                │      │  
   │       │   │               │    │                   │                │      │  
   │       │   │  Band Page    │    │ Audience Page     │                │      │  
   │       │   │               │    │                   │                │      │  
   │       │   └────┬────────┬─┘    └──────────┬──────┬─┘                │      │  
   │       │        │        │                 │      │                  │      │  
   │       └────────┼────────┼─────────────────┼──────┼──────────────────┘      │  
   │                │        ├─────────────────┘      │                         │  
   │                └────────┼────────────────────────┤                         │  
   │                         │                        │                         │  
   │       ┌─────────────────┼────────────────────────┼──────────────────┐      │  
   │       │                 │                        │                  │      │  
   │       │    Docker (WSL) │                        │                  │      │  
   │       │                 │                        │                  │      │  
   │       │   ┌─────────────▼──┐        ┌────────────▼─────────────┐    │      │  
   │       │   │                │        │                          │    │      │  
   │       │   │    UI          │        │  API (HTTP + socket.io)  │    │      │  
   │       │   │    Port 8080   │        │  Port 33001              │    │      │  
   │       │   │                │        │                          │    │      │  
   │       │   └────────────────┘        └──────────────────────────┘    │      │  
   │       │                                            ▲                │      │  
   │       │                                            │                │      │  
   │       └────────────────────────────────────────────┼────────────────┘      │  
   │                                                    │                       │  
   │                                                    │                       │  
   │                                                    │                       │  
   │         ┌─────────────────────┐                    │                       │  
   │         │                     │                    │                       │  
   │         │   Walk-on helper    ├────────────────────┤                       │  
   │         │   Volume control    │                    │                       │  
   │         │                     │                    │                       │  
   │         └─────────────────────┘                    │                       │  
   │                                                    │                       │  
   │                                                    │                       │  
   └────────────────────────────────────────────────────┼───────────────────────┘  
                                                        │                          
                                                        │                          
                                                        │                          
   ┌────────────────────────────────────────────────────┼───────────────────────┐  
   │                                                    │                       │  
   │   RASPBERRY PI                                     │                       │  
   │   (Stomp Box)                                      │                       │  
   │                                 ┌──────────────────┴───────────────┐       │  
   │                                 │                                  │       │  
   │                                 │    tss-stomp                     │       │  
   │                                 │    Footswitches + LEDs           │       │  
   │                                 │                                  │       │  
   │                                 └──────────────────────────────────┘       │  
   │                                                                            │  
   │                                                                            │  
   │                                                                            │  
   └────────────────────────────────────────────────────────────────────────────┘  
                                                                                   
                                                                                   
                                                                                   
```

## Components

| Component | Location | Description |
|-----------|----------|-------------|
| **UI (Web)** | `src/web/` | React frontend for Band and Audience pages |
| **API** | `src/api/` | Express.js backend with WebSocket support |
| **tss-stomp** | `src/tss-stomp/` | Python app for Raspberry Pi GPIO/pedal control |
| **walkon-helper** | `src/walkon-helper/` | Go app to control Windows system volume |

## Quick Start

```bash
# Start UI and API in Docker
docker compose up

# Run stomp box on Raspberry Pi
cd src/tss-stomp && uv run python -m tss_stomp

# Run volume helper on Windows
./walkon-helper.exe
```
