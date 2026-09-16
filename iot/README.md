# Module IoT — FutureKawa

Nœud capteur Arduino UNO + DHT22 → série USB → passerelle Python → MQTT (QoS 1).
L'UNO émet `T=..;H=..` ; la passerelle horodate, valide, met en buffer et publie.

## Contrat MQTT

- Mesures : `futurekawa/{pays}/{entrepot}/mesures`, QoS 1
  payload `{"temperature", "humidite", "mesure_le", "device_id"}`
- Status : `futurekawa/{pays}/{entrepot}/status` — `online` / `offline` (LWT) / `sensor_error`

## 1. Tests de la logique (sans matériel)

```bash
cd iot
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
pytest -v
```

## 2. Démo reproductible sans UNO (faux device sur pty)

```bash
cd iot/demo && docker compose up -d                 # broker + abonné
cd iot && . .venv/bin/activate && python demo/fake_device.py   # note PTY=...
cp gateway/config.example.py gateway/config.py
GATEWAY_SERIAL_PORT=<PTY> MQTT_BROKER=localhost GATEWAY_INTERVAL_S=3 python gateway/gateway.py
rtk proxy docker logs demo-subscriber-1 | grep futurekawa   # mesures visibles
```

Arrêt : `docker compose down` dans `iot/demo`, `rm gateway/config.py`.

## 3. Matériel réel (UNO)

1. Câblage DHT22 : `VCC→5V`, `GND→GND`, `DATA→D2`, pull-up 10 kΩ entre DATA et VCC.
2. Uploader `firmware/futurekawa_sensor/futurekawa_sensor.ino` sur l'UNO (IDE Arduino ou `arduino-cli`, lib Adafruit DHT).
3. `cp gateway/config.example.py gateway/config.py` et régler `SERIAL_PORT` sur le port de l'UNO (`/dev/cu.usbmodem*` sur macOS), `MQTT_BROKER` sur l'IP du broker.
4. `python gateway/gateway.py`.

## 4. Compilation

Vérifier que le sketch compile (build check, sans compte) :

```bash
cd firmware && arduino-cli compile --fqbn arduino:avr:uno futurekawa_sensor
```

## Structure

- `firmware/` sketch Arduino UNO
- `gateway/` passerelle Python (logique pure + glue série/MQTT)
- `tests/` tests pytest de la logique pure
- `demo/` broker Mosquitto + abonné + faux device (pty)

## Liens

- README racine (architecture, ordre de démarrage) : [`../README.md`](../README.md)
- Backend pays (consomme les mesures publiées ici) : [`../backend-local/README.md`](../backend-local/README.md)
- Dossier technique argumenté : PDF dans [`../docs/`](../docs/)
