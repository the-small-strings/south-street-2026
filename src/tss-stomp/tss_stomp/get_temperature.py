#!/usr/bin/env python3
"""Read the current CPU temperature on a Raspberry Pi."""

import sys


def get_cpu_temperature() -> float:
    """
    Read the CPU temperature from the thermal zone file.
    
    Returns:
        The CPU temperature in degrees Celsius.
    
    Raises:
        FileNotFoundError: If the thermal zone file doesn't exist.
        ValueError: If the temperature value cannot be parsed.
    """
    thermal_zone_path = "/sys/class/thermal/thermal_zone0/temp"
    
    with open(thermal_zone_path, "r") as f:
        temp_millidegrees = int(f.read().strip())
    
    # Convert from millidegrees to degrees Celsius
    return temp_millidegrees / 1000.0


def main() -> None:
    """Main entry point."""
    try:
        temperature = get_cpu_temperature()
        print(f"CPU Temperature: {temperature:.1f}°C")
    except FileNotFoundError:
        print("Error: Could not find thermal zone file.", file=sys.stderr)
        print("This script is designed to run on a Raspberry Pi.", file=sys.stderr)
        sys.exit(1)
    except ValueError as e:
        print(f"Error: Could not parse temperature value: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
