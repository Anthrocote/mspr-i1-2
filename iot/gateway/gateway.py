import time

import serial

from config import (SERIAL_PORT, SERIAL_BAUD, MQTT_BROKER, MQTT_PORT,
                    PAYS, ENTREPOT, DEVICE_ID, PUBLISH_INTERVAL_S, SENSOR_SILENCE_S)
from serial_line import parse_line
from sensor import is_plausible
from payload import format_iso8601
from ring_buffer import RingBuffer
from throttle import should_publish
from mqtt_publisher import MqttPublisher

BUFFER_CAPACITY = 60
SERIAL_RETRY_S = 2


def _try_open_serial(port, baud):
    try:
        return serial.Serial(port, baud, timeout=1)
    except serial.SerialException:
        return None


def _now_iso():
    return format_iso8601(time.gmtime())


def _flush(publisher, buffer):
    pending = buffer.drain()
    for index in range(len(pending)):
        temperature, humidite, mesure_le = pending[index]
        try:
            publisher.publish_mesure(temperature, humidite, mesure_le, DEVICE_ID)
        except OSError:
            # Re-buffer the failed measure AND every measure not yet published,
            # in order. Bounded buffer may drop oldest.
            for item in pending[index:]:
                buffer.append(item)
            return


def run():
    base_topic = "futurekawa/%s/%s" % (PAYS, ENTREPOT)
    publisher = MqttPublisher(DEVICE_ID, MQTT_BROKER, MQTT_PORT, base_topic)
    publisher.connect_with_retry(time.sleep)

    buffer = RingBuffer(BUFFER_CAPACITY)
    ser = None
    last_reading = None
    last_valid_at = time.monotonic()
    last_publish_at = 0.0
    sensor_error_reported = False

    while True:
        if ser is None:
            ser = _try_open_serial(SERIAL_PORT, SERIAL_BAUD)

        raw = ""
        if ser is not None:
            try:
                # readline blocks up to the serial timeout (1 s), which paces the
                # loop while the port is open; the explicit sleep below only covers
                # the port-down case where there is no blocking read.
                raw = ser.readline().decode("utf-8", "replace")
            except serial.SerialException:
                ser = None

        reading = parse_line(raw) if raw else None
        if reading and is_plausible(*reading):
            last_reading = reading
            last_valid_at = time.monotonic()
            # Recovery from a reported sensor_error: the MQTT session never
            # dropped, so _on_connect won't fire — republish online explicitly,
            # otherwise the retained status stays stuck on sensor_error and the
            # backend alert never resolves once readings resume.
            if sensor_error_reported:
                publisher.publish_online()
            sensor_error_reported = False

        now = time.monotonic()
        if now - last_valid_at >= SENSOR_SILENCE_S and not sensor_error_reported:
            publisher.publish_sensor_error()
            sensor_error_reported = True

        if should_publish(last_reading is not None, last_valid_at, last_publish_at,
                          now, PUBLISH_INTERVAL_S):
            temperature, humidite = last_reading
            buffer.append((temperature, humidite, _now_iso()))
            _flush(publisher, buffer)
            last_publish_at = now

        # When the serial port is down, the loop still runs (silence detection,
        # buffered republish) — pace the reopen attempts instead of busy-looping.
        if ser is None:
            time.sleep(SERIAL_RETRY_S)


if __name__ == "__main__":
    run()
