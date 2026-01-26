from gpiozero.pins.mock import MockFactory, MockPin
from typing import Callable

# List of callbacks to notify when pin state changes
_pin_change_handlers: list[Callable[[int, bool], None]] = []


def add_pin_change_handler(handler: Callable[[int, bool], None]):
    """Register a handler to be called when any pin state changes.
    
    Args:
        handler: A function that takes (pin_number: int, state: bool)
    """
    _pin_change_handlers.append(handler)


def remove_pin_change_handler(handler: Callable[[int, bool], None]):
    """Remove a previously registered handler."""
    if handler in _pin_change_handlers:
        _pin_change_handlers.remove(handler)

def _notify_pin_change(pin_number: int, state: bool):
    for handler in _pin_change_handlers:
        try:
            handler(pin_number, state)
        except Exception:
            pass  # Don't let handler errors break pin operation

        
class MockPinWithNotification(MockPin):
    def _change_state(self, value):
        result = super()._change_state(value)
        # Notify all registered handlers
        _notify_pin_change(self.number, value)
        return result