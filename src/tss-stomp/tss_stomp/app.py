from signal import pause
from gpiozero import LED, Button
from typing import Callable, Any

from tss_stomp import api
from tss_stomp.pins import pins

class App:
    led_ready: LED
    led_error: LED
    led_line_win_1: LED
    led_line_win_2: LED
    led_line_win_3: LED
    led_house_win_1: LED
    led_house_win_2: LED

    button_next: Button
    button_prev: Button
    button_orange: Button
    button_black: Button
    button_clear: Button

    _button_handlers: dict[Button, Callable[..., Any]] = {}

    def __init__(self):
        self.led_ready = LED(pins.LED_READY)
        self.led_error = LED(pins.LED_ERROR)
        self.button_next = Button(pins.BUTTON_NEXT, bounce_time=0.1)
        self.button_prev = Button(pins.BUTTON_PREV, bounce_time=0.1)
        self.button_orange = Button(pins.BUTTON_ORANGE, bounce_time=0.1)
        self.button_black = Button(pins.BUTTON_BLACK, bounce_time=0.1)
        self.button_clear = Button(pins.BUTTON_CLEAR, bounce_time=0.1)

        # House win LEDs (2 LEDs for first 2 house wins)
        self.led_house_win_1 = LED(pins.LED_HOUSE_WIN_1)
        self.led_house_win_2 = LED(pins.LED_HOUSE_WIN_2)

        # Line win LEDs (3 LEDs for first 3 line wins)
        self.led_line_win_1 = LED(pins.LED_LINE_WIN_1)
        self.led_line_win_2 = LED(pins.LED_LINE_WIN_2)
        self.led_line_win_3 = LED(pins.LED_LINE_WIN_3)

    def update_win_leds(self):
        """Update the house and line win LEDs based on game state."""
        state = api.get_game_state()
        if state is None:
            return

        # Get win counts from game state
        house_wins = state.get("houseWinCount", 0)
        line_wins = state.get("lineWinCount", 0)

        # Update house win LEDs (light up based on count)
        self.led_house_win_1.value = 1 if house_wins >= 1 else 0
        self.led_house_win_2.value = 1 if house_wins >= 2 else 0

        # Update line win LEDs (light up based on count)
        self.led_line_win_1.value = 1 if line_wins >= 1 else 0
        self.led_line_win_2.value = 1 if line_wins >= 2 else 0
        self.led_line_win_3.value = 1 if line_wins >= 3 else 0

        print(
            f"Updated LEDs - House wins: {house_wins}, Line wins: {line_wins}")

    def wrap_button_handler(self, func=None, *, name="", button=None):
        """Decorator to wrap button handlers with logging and ready LED control."""
        if not name:
            raise ValueError(
                "Name must be provided for button handler decorator.")
        if button is None:
            raise ValueError(
                "Button instance must be provided for button handler decorator.")

        def decorator(f):
            def wrapper(*args, **kwargs):
                print(f"Button ({name}) pressed - start")
                self.led_ready.off()
                result = f(*args, **kwargs)
                if result:
                    self.led_error.off()
                else:
                    self.led_error.on()
                self.update_win_leds()
                self.led_ready.on()
                print(f"Button ({name}) pressed - end")
                print("")
                return result

            # Add the wrapper to button events
            button.when_activated = wrapper
            button.when_deactivated = wrapper
            return wrapper

        if func:
            return decorator(func)
        return decorator

    def run(self):
        """Run the main application loop."""

        # Initialize win LEDs on startup
        print("Initializing win LEDs from game state...")
        self.update_win_leds()

        # Turn off error LED on startup
        self.led_error.off()

        # Turn on ready LED to indicate app is ready
        self.led_ready.on()
        print("Ready, waiting for button presses...")
        pause()
