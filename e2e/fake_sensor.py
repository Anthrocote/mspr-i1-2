"""Configurable fake DHT22 sensor for the e2e suite.

Same idea as iot/demo/fake_device.py — write firmware-format lines
(`T=29.4;H=56.1`) to a pseudo-terminal that the real gateway reads as a serial
port — but the emitted values are driven at runtime so a scenario can push the
warehouse out of range (45 °C) and then back in (29 °C) without restarting the
gateway. The sensor re-reads a small JSON state file every cycle; the e2e writes
to it. Missing/invalid file falls back to the nominal in-range reading.

Env:
  FAKE_STATE_FILE  path to the JSON state file ({"temperature":45.0,"humidity":55.0})
  FAKE_PERIOD_S    seconds between lines (default 1.0)

Prints `PTY=<path>` once on startup so the caller can point the gateway at it.
"""

import json
import os
import time

NOMINAL = (29.0, 55.0)


def _read_state(path: str) -> tuple[float, float]:
    try:
        with open(path) as fh:
            data = json.load(fh)
        return float(data["temperature"]), float(data["humidity"])
    except (OSError, ValueError, KeyError):
        return NOMINAL


def main() -> None:
    state_file = os.environ.get("FAKE_STATE_FILE", "")
    period = float(os.environ.get("FAKE_PERIOD_S", "1.0"))

    master, slave = os.openpty()
    print("PTY=%s" % os.ttyname(slave), flush=True)

    while True:
        temperature, humidity = _read_state(state_file) if state_file else NOMINAL
        line = "T=%.1f;H=%.1f\n" % (temperature, humidity)
        os.write(master, line.encode())
        time.sleep(period)


if __name__ == "__main__":
    main()
