import os
import paho.mqtt.client as mqtt

BROKER = os.environ.get("MQTT_BROKER", "localhost")
TOPIC = "futurekawa/+/+/#"


def on_connect(client, userdata, flags, reason_code, properties=None):
    print("subscriber connected rc=%s" % reason_code, flush=True)
    client.subscribe(TOPIC, qos=1)


def on_message(client, userdata, msg):
    print("%s -> %s" % (msg.topic, msg.payload.decode()), flush=True)


client = mqtt.Client(
    callback_api_version=mqtt.CallbackAPIVersion.VERSION2,
    client_id="demo-subscriber",
    clean_session=False,
)
client.on_connect = on_connect
client.on_message = on_message
client.connect(BROKER, 1883, keepalive=60)
client.loop_forever()
