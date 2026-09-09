import paho.mqtt.client as mqtt

from backoff import next_backoff
from payload import build_payload

PUBLISH_TIMEOUT_S = 5


class MqttPublisher:
    def __init__(self, client_id, broker, port, base_topic, keepalive=60):
        self._broker = broker
        self._port = port
        self._base_topic = base_topic          # futurekawa/{pays}/{entrepot}
        self._keepalive = keepalive
        self._client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
            client_id=client_id,
        )
        self._client.will_set(self._status_topic(), "offline", qos=1, retain=True)
        self._client.on_connect = self._on_connect

    def _status_topic(self):
        return self._base_topic + "/status"

    def _mesures_topic(self):
        return self._base_topic + "/mesures"

    def _on_connect(self, client, userdata, flags, reason_code, properties=None):
        # Re-publish online on every (re)connection, including paho's automatic
        # background reconnects, so the retained status never stays stuck offline.
        client.publish(self._status_topic(), "online", qos=1, retain=True)

    def connect(self):
        self._client.connect(self._broker, self._port, keepalive=self._keepalive)
        self._client.loop_start()

    def connect_with_retry(self, sleep):
        attempt = 0
        while True:
            try:
                self.connect()
                return
            except OSError:
                sleep(next_backoff(attempt))
                attempt += 1

    def publish_mesure(self, temperature, humidite, mesure_le, device_id):
        if not self._client.is_connected():
            raise OSError("mqtt not connected")
        message = build_payload(temperature, humidite, mesure_le, device_id)
        info = self._client.publish(self._mesures_topic(), message, qos=1)
        if info.rc != mqtt.MQTT_ERR_SUCCESS:
            raise OSError("publish failed rc=%s" % info.rc)
        info.wait_for_publish(timeout=PUBLISH_TIMEOUT_S)
        if not info.is_published():
            raise OSError("publish not acked within %ss" % PUBLISH_TIMEOUT_S)

    def publish_sensor_error(self):
        self._client.publish(self._status_topic(), "sensor_error", qos=1, retain=True)
