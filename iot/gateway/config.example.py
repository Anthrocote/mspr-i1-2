import os

# Copier vers config.py et adapter. config.py est gitignore.
SERIAL_PORT = os.environ.get("GATEWAY_SERIAL_PORT", "/dev/ttyUSB0")
SERIAL_BAUD = 115200
MQTT_BROKER = os.environ.get("MQTT_BROKER", "localhost")
MQTT_PORT = 1883
PAYS = "br"                    # code pays ISO, en minuscules
ENTREPOT = "entrepot-sao-paulo"
DEVICE_ID = "uno-br-01"
PUBLISH_INTERVAL_S = int(os.environ.get("GATEWAY_INTERVAL_S", "60"))
SENSOR_SILENCE_S = 10          # silence serie au-dela => sensor_error
