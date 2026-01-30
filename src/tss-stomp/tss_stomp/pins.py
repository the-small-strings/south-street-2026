import os
from gpiozero import Device
from gpiozero.pins.mock import MockFactory

from tss_stomp import pins
from tss_stomp.mock_pin_server.pins import MockPinWithNotification
from tss_stomp.mock_pin_server import server as pin_server


LED_READY = 26
LED_ERROR = 19
LED_LINE_WIN_1 = 13
LED_LINE_WIN_2 = 6
LED_LINE_WIN_3 = 5
LED_HOUSE_WIN_1 = 27
LED_HOUSE_WIN_2 = 17
BUTTON_PREV = 21
BUTTON_CLEAR = 20
BUTTON_ORANGE = 16
BUTTON_BLACK = 12
BUTTON_NEXT = 24


if os.getenv("USE_MOCK_GPIO", "false").lower() == "true":
    Device.pin_factory = MockFactory(pin_class=MockPinWithNotification)
    # Start the web server for pin control
    pin_names = {
        pins.LED_READY: "LED Ready",
        pins.LED_ERROR: "LED Error",
        pins.BUTTON_NEXT: "Button (next)",
        pins.BUTTON_PREV: "Button (previous)",
        pins.BUTTON_ORANGE: "Button (orange)",
        pins.BUTTON_BLACK: "Button (black)",
        pins.BUTTON_CLEAR: "Button (clear)",
        pins.LED_HOUSE_WIN_1: "LED House Win 1",
        pins.LED_HOUSE_WIN_2: "LED House Win 2",
        pins.LED_LINE_WIN_1: "LED Line Win 1",
        pins.LED_LINE_WIN_2: "LED Line Win 2",
        pins.LED_LINE_WIN_3: "LED Line Win 3",
    }
    pin_server.run_server(pin_names=pin_names)
