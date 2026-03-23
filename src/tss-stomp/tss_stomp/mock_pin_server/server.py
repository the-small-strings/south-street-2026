from flask import Flask, render_template_string, jsonify, request
from flask_socketio import SocketIO
from gpiozero import Device
from gpiozero.pins.mock import MockFactory
import threading
import logging

from tss_stomp.mock_pin_server.pins import add_pin_change_handler

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Disable Flask/Werkzeug request logging by default
logging.getLogger('werkzeug').setLevel(logging.ERROR)

# Dictionary mapping pin numbers to custom names
pin_names_map: dict[int, str] = {}

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>GPIO Pin Control</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        h1 {
            color: #333;
        }
        .pin-list {
            list-style: none;
            padding: 0;
        }
        .pin-item {
            background: white;
            margin: 10px 0;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .pin-info {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .pin-number {
            font-weight: bold;
            font-size: 1.2em;
            min-width: 80px;
        }
        .pin-name {
            color: #666;
            font-style: italic;
        }
        .pin-value {
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
        }
        .pin-value.high {
            background-color: #4CAF50;
            color: white;
        }
        .pin-value.low {
            background-color: #f44336;
            color: white;
        }
        .pin-controls button {
            padding: 8px 20px;
            margin-left: 10px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1em;
        }
        .btn-toggle {
            background-color: #673AB7;
            color: white;
        }
        .btn-toggle:hover {
            background-color: #512DA8;
        }
        .pin-function {
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 0.85em;
            text-transform: uppercase;
        }
        .pin-function.input {
            background-color: #2196F3;
            color: white;
        }
        .pin-function.output {
            background-color: #9C27B0;
            color: white;
        }
        .no-pins {
            color: #666;
            font-style: italic;
        }
        .refresh-btn {
            background-color: #2196F3;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-bottom: 20px;
        }
        .refresh-btn:hover {
            background-color: #1976D2;
        }
        .pin-group {
            margin-bottom: 30px;
        }
        .pin-group h2 {
            color: #444;
            border-bottom: 2px solid #ddd;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        .pin-group h2.inputs {
            border-color: #2196F3;
        }
        .pin-group h2.outputs {
            border-color: #9C27B0;
        }
    </style>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
</head>
<body>
    <h1>GPIO Pin Control</h1>
    <button class="refresh-btn" onclick="loadPins()">Refresh</button>
    <div id="pin-container">
        <p class="no-pins">Loading pins...</p>
    </div>

    <script>
        const socket = io();
        
        socket.on('connect', () => {
            console.log('WebSocket connected');
            loadPins();
        });
        
        socket.on('pin_update', (data) => {
            console.log('Pin update received:', data);
            updatePinDisplay(data.pin_number, data.state);
        });
        
        socket.on('pins_changed', () => {
            console.log('Pins changed, reloading...');
            loadPins();
        });
        
        function updatePinDisplay(pinNumber, state) {
            const stateElement = document.getElementById('state-' + pinNumber);
            if (stateElement) {
                const isHigh = state;
                stateElement.textContent = isHigh ? 'HIGH' : 'LOW';
                stateElement.className = 'pin-value ' + (isHigh ? 'high' : 'low');
            }
        }

        async function loadPins() {
            const response = await fetch('/api/pins');
            const pins = await response.json();
            const pinContainer = document.getElementById('pin-container');
            
            if (pins.length === 0) {
                pinContainer.innerHTML = '<p class="no-pins">No pins have been accessed yet.</p>';
                return;
            }
            
            const inputs = pins.filter(pin => pin.function === 'input');
            const outputs = pins.filter(pin => pin.function === 'output');
            
            let html = '';
            
            if (inputs.length > 0) {
                html += `
                <div class="pin-group">
                    <h2 class="inputs">Inputs</h2>
                    <ul class="pin-list">
                        ${inputs.map(pin => renderPin(pin)).join('')}
                    </ul>
                </div>`;
            }
            
            if (outputs.length > 0) {
                html += `
                <div class="pin-group">
                    <h2 class="outputs">Outputs</h2>
                    <ul class="pin-list">
                        ${outputs.map(pin => renderPin(pin)).join('')}
                    </ul>
                </div>`;
            }
            
            pinContainer.innerHTML = html;
        }
        
        function renderPin(pin) {
            const isInput = pin.function === 'input';
            const isHigh = pin.state;
            
            return `
            <li class="pin-item">
                <div class="pin-info">
                    <span class="pin-number">Pin ${pin.number}${pin.name ? ` <span class="pin-name">(${pin.name})</span>` : ''}</span>
                    <span class="pin-function ${pin.function}">${pin.function}</span>
                    <span class="pin-value ${isHigh ? 'high' : 'low'}" id="state-${pin.number}">
                        ${isHigh ? 'HIGH' : 'LOW'}
                    </span>
                </div>
                ${isInput ? `
                <div class="pin-controls">
                    <button class="btn-toggle" onclick="togglePin(${pin.number})">Toggle</button>
                </div>
                ` : ''}
            </li>
            `;
        }

        async function togglePin(pinNumber) {
            await fetch('/api/pins/' + pinNumber + '/toggle', {
                method: 'POST'
            });
        }
        
        // Initial load
        loadPins();
    </script>
</body>
</html>
"""


@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)


@app.route('/api/pins')
def get_pins():
    """Get all pins that have been accessed."""
    pins = []
    pin_factory = Device.pin_factory
    
    if pin_factory is None:
        return jsonify([])
    
    # MockFactory stores pins in pins dict
    if hasattr(pin_factory, 'pins'):
        factory_pins = {pin.number: pin for pin in pin_factory.pins.values()}

        # Add pins in pin_names_map order first (preserve the order the caller set the pins)
        for pin_number in pin_names_map:
            if pin_number in factory_pins:
                pin = factory_pins.pop(pin_number)
                pins.append({
                    'number': pin.number,
                    'state': pin.state,
                    'function': pin.function,
                    'name': pin_names_map.get(pin.number)
                })

        # Then any remaining pins not in the map, sorted by number
        for pin in sorted(factory_pins.values(), key=lambda p: p.number):
            pins.append({
                'number': pin.number,
                'state': pin.state,
                'function': pin.function,
                'name': None
            })
    return jsonify(pins)


@app.route('/api/pins/<int:pin_number>', methods=['POST'])
def set_pin(pin_number):
    """Set a pin high or low. Only works for input pins (simulating external signals)."""
    data = request.json
    high = data.get('high', False)
    
    pin_factory: MockFactory | None = Device.pin_factory
    if pin_factory is None:
        return jsonify({'error': 'No pin factory configured'}), 400
    
    if hasattr(pin_factory, 'pins'):
        # Find pin by its number attribute
        for pin_key, pin in pin_factory.pins.items():
            if pin.number == pin_number:
                # Only allow changing state for input pins
                # (simulating external signals to input pins)
                if pin.function != 'input':
                    return jsonify({
                        'error': f'Pin {pin_number} is an output pin - cannot change state externally'
                    }), 400
                
                if high:
                    pin.drive_high()
                else:
                    pin.drive_low()
                return jsonify({'success': True, 'state': pin.state})
    
    return jsonify({'error': f'Pin {pin_number} not found'}), 404


@app.route('/api/pins/<int:pin_number>/toggle', methods=['POST'])
def toggle_pin(pin_number):
    """Toggle a pin's state. Only works for input pins (simulating external signals)."""
    pin_factory: MockFactory | None = Device.pin_factory
    if pin_factory is None:
        return jsonify({'error': 'No pin factory configured'}), 400
    
    if hasattr(pin_factory, 'pins'):
        for pin_key, pin in pin_factory.pins.items():
            if pin.number == pin_number:
                if pin.function != 'input':
                    return jsonify({
                        'error': f'Pin {pin_number} is an output pin - cannot change state externally'
                    }), 400
                
                if pin.state:
                    pin.drive_low()
                else:
                    pin.drive_high()
                return jsonify({'success': True, 'state': pin.state})
    
    return jsonify({'error': f'Pin {pin_number} not found'}), 404


def broadcast_pin_update(pin_number: int, state: bool):
    """Broadcast a pin state change to all connected WebSocket clients."""
    socketio.emit('pin_update', {
        'pin_number': pin_number,
        'state': state,
        'name': pin_names_map.get(pin_number)
    })


def run_server(host='0.0.0.0', port=35000, pin_names: dict[int, str] | None = None):
    """Run the web server in a background thread.
    
    Args:
        host: Host to bind to
        port: Port to listen on
        pin_names_map: Optional dict mapping pin numbers to names, e.g. {5: "LED", 17: "Button"}
    """
    global pin_names_map
    if pin_names:
        pin_names_map = pin_names
    
    # Register handler for pin state changes
    add_pin_change_handler(broadcast_pin_update)
    
    thread = threading.Thread(
        target=lambda: socketio.run(app, host=host, port=port, debug=False, use_reloader=False, allow_unsafe_werkzeug=True),
        daemon=True
    )
    thread.start()
    print(f"Pin control web server running at http://{host}:{port}")
    return thread


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=35000, debug=True)
