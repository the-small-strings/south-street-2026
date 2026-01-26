from signal import pause
from gpiozero import Button

# button = Button(24)
button = Button(24, bounce_time=0.1)

def on_button_pressed():
	print("Button pressed!")

button.when_pressed = on_button_pressed
button.when_released = on_button_pressed

print("Press the button connected to GPIO 24...")
pause()  # Keep the program running to listen for button presses