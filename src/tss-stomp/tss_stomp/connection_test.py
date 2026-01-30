#!/usr/bin/env python3
"""
LED Connection Test Script

This script tests the LED connections by:
1. Turning all LEDs on for 2 seconds
2. Turning all LEDs off
3. Flashing each LED 5 times in sequence
4. Testing buttons - each button flashes a specific LED
"""

from gpiozero import LED, Button, Device
from time import sleep
import os


from tss_stomp import pins as pins


# Initialize all LEDs
led_ready = LED(pins.LED_READY)
led_error = LED(pins.LED_ERROR)
led_line_win_1 = LED(pins.LED_LINE_WIN_1)
led_line_win_2 = LED(pins.LED_LINE_WIN_2)
led_line_win_3 = LED(pins.LED_LINE_WIN_3)
led_house_win_1 = LED(pins.LED_HOUSE_WIN_1)
led_house_win_2 = LED(pins.LED_HOUSE_WIN_2)

leds = [
    ("Line Win 1", led_line_win_1),
    ("Line Win 2", led_line_win_2),
    ("Line Win 3", led_line_win_3),
    ("House Win 1", led_house_win_1),
    ("House Win 2", led_house_win_2),
    ("Ready", led_ready),
    ("Error", led_error),
]

# Initialize all buttons
button_next = Button(pins.BUTTON_NEXT, bounce_time=0.1)
button_prev = Button(pins.BUTTON_PREV, bounce_time=0.1)
button_orange = Button(pins.BUTTON_ORANGE, bounce_time=0.1)
button_black = Button(pins.BUTTON_BLACK, bounce_time=0.1)
button_clear = Button(pins.BUTTON_CLEAR, bounce_time=0.1)


def all_leds_on():
    """Turn all LEDs on."""
    print("Turning all LEDs ON...")
    for name, led in leds:
        led.on()
        print(f"  {name}: ON")


def all_leds_off():
    """Turn all LEDs off."""
    print("Turning all LEDs OFF...")
    for name, led in leds:
        led.off()
        print(f"  {name}: OFF")


def flash_led(name: str, led: LED, times: int = 5, on_time: float = 0.2, off_time: float = 0.2):
    """Flash a single LED a specified number of times."""
    print(f"Flashing {name} {times} times...")
    for i in range(times):
        led.on()
        sleep(on_time)
        led.off()
        sleep(off_time)


def run_led_test():
    """Run the full LED connection test."""
    print("=" * 50)
    print("LED CONNECTION TEST")
    print("=" * 50)
    print()

    # Step 1: Turn all LEDs on for 2 seconds
    print("Step 1: All LEDs ON for 2 seconds")
    print("-" * 30)
    all_leds_on()
    sleep(2)
    print()

    # Step 2: Turn all LEDs off
    print("Step 2: All LEDs OFF")
    print("-" * 30)
    all_leds_off()
    sleep(0.5)
    print()

    # Step 3: Flash each LED 3 times in sequence
    print("Step 3: Flash each LED 3 times in sequence")
    print("-" * 30)
    for name, led in leds:
        flash_led(name, led, times=3)
    print()

    print("=" * 50)
    print("CONNECTION TEST COMPLETE")
    print("=" * 50)


def run_button_test():
    """Run the button test - each button flashes a specific LED."""
    print()
    print("=" * 50)
    print("BUTTON TEST")
    print("=" * 50)
    print()
    print("Press each button to test:")
    print("  - Orange  -> flashes Line Win 1")
    print("  - Black   -> flashes Line Win 2")
    print("  - Next    -> flashes Line Win 3")
    print("  - Prev    -> flashes House Win 1")
    print("  - Clear   -> flashes House Win 2")
    print()
    print("Once all buttons are pressed, Ready LED will flash.")
    print("-" * 50)

    buttons_pressed = {
        "orange": False,
        "black": False,
        "next": False,
        "prev": False,
        "clear": False,
    }

    def check_all_pressed():
        """Check if all buttons have been pressed and flash Ready LED."""
        if all(buttons_pressed.values()):
            print()
            print("All buttons tested!")
            flash_led("Ready", led_ready, times=5)
            return True
        return False

    def on_orange():
        print("Orange pressed!")
        flash_led("Line Win 1", led_line_win_1, times=3)
        buttons_pressed["orange"] = True
        check_all_pressed()

    def on_black():
        print("Black pressed!")
        flash_led("Line Win 2", led_line_win_2, times=3)
        buttons_pressed["black"] = True
        check_all_pressed()

    def on_next():
        print("Next pressed!")
        flash_led("Line Win 3", led_line_win_3, times=3)
        buttons_pressed["next"] = True
        check_all_pressed()

    def on_prev():
        print("Prev pressed!")
        flash_led("House Win 1", led_house_win_1, times=3)
        buttons_pressed["prev"] = True
        check_all_pressed()

    def on_clear():
        print("Clear pressed!")
        flash_led("House Win 2", led_house_win_2, times=3)
        buttons_pressed["clear"] = True
        check_all_pressed()

    # Attach button handlers
    button_orange.when_pressed = on_orange
    button_orange.when_released = on_orange
    button_black.when_pressed = on_black
    button_black.when_released = on_black
    button_next.when_pressed = on_next
    button_next.when_released = on_next
    button_prev.when_pressed = on_prev
    button_prev.when_released = on_prev
    button_clear.when_pressed = on_clear
    button_clear.when_released = on_clear

    # Wait for all buttons to be pressed
    while not all(buttons_pressed.values()):
        sleep(0.1)

    print()
    print("=" * 50)
    print("BUTTON TEST COMPLETE")
    print("=" * 50)


if __name__ == "__main__":
    try:
        run_led_test()
        run_button_test()
        sleep(1)
                
    except KeyboardInterrupt:
        print("\nTest interrupted by user.")
        all_leds_off()
