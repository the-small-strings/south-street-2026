from signal import pause
from gpiozero import LED, Button, Device
from gpiozero.pins.mock import MockFactory
from time import sleep
import os

from tss_stomp import api
from tss_stomp.mock_pin_server.pins import MockPinWithNotification
from tss_stomp.mock_pin_server import server as pin_server

PIN_LED_READY = 26
PIN_LED_ERROR = 19
PIN_LED_LINE_WIN_1 = 13
PIN_LED_LINE_WIN_2 = 6
PIN_LED_LINE_WIN_3 = 5
PIN_LED_HOUSE_WIN_1 = 27
PIN_LED_HOUSE_WIN_2 = 17
PIN_BUTTON_PREV = 21
PIN_BUTTON_CLEAR = 20
PIN_BUTTON_ORANGE = 16
PIN_BUTTON_BLACK = 12
PIN_BUTTON_NEXT = 24

if os.getenv("USE_MOCK_GPIO", "false").lower() == "true":
    Device.pin_factory = MockFactory(pin_class=MockPinWithNotification)
    # Start the web server for pin control
    pin_names = {
        PIN_LED_READY: "LED Reeady", 
        PIN_LED_ERROR: "LED Error",
        PIN_BUTTON_NEXT: "Button (next)", 
        PIN_BUTTON_PREV: "Button (previous)", 
        PIN_BUTTON_ORANGE: "Button (orange)", 
        PIN_BUTTON_BLACK: "Button (black)", 
        PIN_BUTTON_CLEAR: "Button (clear)",
        PIN_LED_HOUSE_WIN_1: "LED House Win 1",
        PIN_LED_HOUSE_WIN_2: "LED House Win 2",
        PIN_LED_LINE_WIN_1: "LED Line Win 1",
        PIN_LED_LINE_WIN_2: "LED Line Win 2",
        PIN_LED_LINE_WIN_3: "LED Line Win 3",
    }
    pin_server.run_server(pin_names=pin_names)


ready_led = LED(PIN_LED_READY)
error_led = LED(PIN_LED_ERROR)
button_next = Button(PIN_BUTTON_NEXT, bounce_time=0.1)
button_prev = Button(PIN_BUTTON_PREV, bounce_time=0.1)
button_orange = Button(PIN_BUTTON_ORANGE, bounce_time=0.1)
button_black = Button(PIN_BUTTON_BLACK, bounce_time=0.1)
button_clear = Button(PIN_BUTTON_CLEAR, bounce_time=0.1)

# House win LEDs (2 LEDs for first 2 house wins)
led_house_win_1 = LED(PIN_LED_HOUSE_WIN_1)
led_house_win_2 = LED(PIN_LED_HOUSE_WIN_2)

# Line win LEDs (3 LEDs for first 3 line wins)
led_line_win_1 = LED(PIN_LED_LINE_WIN_1)
led_line_win_2 = LED(PIN_LED_LINE_WIN_2)
led_line_win_3 = LED(PIN_LED_LINE_WIN_3)

def update_win_leds():
    """Update the house and line win LEDs based on game state."""
    state = api.get_game_state()
    if state is None:
        return
    
    # Get win counts from game state
    house_wins = state.get("houseWinCount", 0)
    line_wins = state.get("lineWinCount", 0)
    
    # Update house win LEDs (light up based on count)
    led_house_win_1.value = 1 if house_wins >= 1 else 0
    led_house_win_2.value = 1 if house_wins >= 2 else 0
    
    # Update line win LEDs (light up based on count)
    led_line_win_1.value = 1 if line_wins >= 1 else 0
    led_line_win_2.value = 1 if line_wins >= 2 else 0
    led_line_win_3.value = 1 if line_wins >= 3 else 0
    
    print(f"Updated LEDs - House wins: {house_wins}, Line wins: {line_wins}")


def on_button_next_pressed():
    print("Button (next) pressed - start")
    ready_led.off()
    success = api.move_next()
    if success:
        error_led.off()
    else:
        error_led.on()
    update_win_leds()
    ready_led.on()
    print("Button (next) pressed - end")
    print("")


def on_button_prev_pressed():
    print("Button (previous) pressed - start")
    ready_led.off()
    success = api.move_previous()
    if success:
        error_led.off()
    else:
        error_led.on()
    update_win_leds()
    ready_led.on()
    print("Button (previous) pressed - end")
    print("")


def on_button_orange_pressed():
    print("Button (orange) pressed - start")
    ready_led.off()
    success = api.set_orange()
    if success:
        error_led.off()
    else:
        error_led.on()
    update_win_leds()
    ready_led.on()
    print("Button (orange) pressed - end")
    print("")


def on_button_black_pressed():
    print("Button (black) pressed - start")
    ready_led.off()
    success = api.set_black()
    if success:
        error_led.off()
    else:
        error_led.on()
    update_win_leds()
    ready_led.on()
    print("Button (black) pressed - end")
    print("")


def on_button_clear_pressed():
    print("Button (clear) pressed - start")
    ready_led.off()
    success = api.clear_battle()
    if success:
        error_led.off()
    else:
        error_led.on()
    update_win_leds()
    ready_led.on()
    print("Button (clear) pressed - end")
    print("")


button_next.when_activated = on_button_next_pressed
button_next.when_deactivated = on_button_next_pressed

button_prev.when_activated = on_button_prev_pressed
button_prev.when_deactivated = on_button_prev_pressed

button_orange.when_activated = on_button_orange_pressed
button_orange.when_deactivated = on_button_orange_pressed

button_black.when_activated = on_button_black_pressed
button_black.when_deactivated = on_button_black_pressed

button_clear.when_activated = on_button_clear_pressed
button_clear.when_deactivated = on_button_clear_pressed


# Initialize win LEDs on startup
print("Initializing win LEDs from game state...")
update_win_leds()

# Turn off error LED on startup
error_led.off()

# Turn on ready LED to indicate app is ready
ready_led.on()
print("Ready, waiting for button presses...")
pause()
