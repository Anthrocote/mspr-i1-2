import logging
from datetime import datetime, timezone

import paho.mqtt.client as mqtt

from app.config import get_settings, thresholds_for
from app.email import SmtpSender
from app.ingest import handle_message

logger = logging.getLogger(__name__)


def _now():
    return datetime.now(timezone.utc)


def make_sender() -> SmtpSender:
    st = get_settings()
    return SmtpSender(st.smtp_host, st.smtp_port, st.smtp_user, st.smtp_pass,
                      st.smtp_from, st.alert_recipient, st.smtp_starttls)


class MqttConsumer:
    def __init__(self, session_factory):
        self._sf = session_factory
        self._st = get_settings()
        self._thresholds = thresholds_for(self._st.country)
        self._sender = make_sender()
        self._client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
            client_id=self._st.mqtt_client_id,
            clean_session=False,
        )
        self._client.on_connect = self._on_connect
        self._client.on_message = self._on_message

    def _on_connect(self, client, userdata, flags, reason_code, properties=None):
        client.subscribe(f"futurekawa/{self._st.country}/+/#", qos=1)

    def _on_message(self, client, userdata, msg):
        with self._sf() as session:
            try:
                handle_message(session, self._st.country, msg.topic, msg.payload,
                               self._thresholds, self._sender, _now)
            except Exception:
                session.rollback()
                logger.exception("Failed to handle MQTT message on %s", msg.topic)

    def start(self):
        # connect_async + loop_start: paho owns the initial connection and the
        # reconnect backoff in its own thread, so a broker that is not up yet at
        # startup does not raise and kill the API.
        self._client.connect_async(self._st.mqtt_broker, self._st.mqtt_port, keepalive=60)
        self._client.loop_start()

    def stop(self):
        self._client.loop_stop()
        self._client.disconnect()
