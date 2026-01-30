from tss_stomp import api
from tss_stomp.app import App


app = App()


@app.wrap_button_handler(name="next", button=app.button_next)
def on_button_next_pressed():
    return api.move_next()


@app.wrap_button_handler(name="previous", button=app.button_prev)
def on_button_prev_pressed():
    return api.move_previous()


@app.wrap_button_handler(name="orange", button=app.button_orange)
def on_button_orange_pressed():
    return api.set_orange()


@app.wrap_button_handler(name="black", button=app.button_black)
def on_button_black_pressed():
    return api.set_black()


@app.wrap_button_handler(name="clear", button=app.button_clear)
def on_button_clear_pressed():
    return api.clear_battle()


app.run()
