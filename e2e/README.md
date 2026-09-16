# FutureKawa — Suite end-to-end

Vérifie la chaîne complète, du faux capteur jusqu'à l'écran du frontend : une mesure
publiée en MQTT traverse le backend pays, se synchronise au siège, et remonte dans
l'interface web.

## Place dans la chaîne

La suite orchestre toute la stack :

- **pays + siège** dans Docker Compose, sur un même réseau (le siège joint le pays
  par nom de service `http://pays:8000`) ;
- **faux capteur + passerelle réelle** sur l'hôte : `fake_sensor.py` écrit des lignes
  au format firmware (`T=29.4;H=56.1`) sur un pseudo-terminal que la passerelle
  `iot/gateway/gateway.py` lit comme un port série, puis publie en MQTT ;
- **frontend** sur l'hôte (`next start`), construit contre le siège.

Tout est démarré et arrêté par les fixtures pytest (`conftest.py`) : le schéma du
siège est migré et amorcé pour que le Brésil soit un pays synchronisable.

## Prérequis

- Docker et Docker Compose
- Python 3.12
- Node 22 (le frontend est bâti et servi pendant les tests)

```bash
cd e2e
python3.12 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

## Lancement

Depuis la racine du dépôt :

```bash
pytest e2e/
```

La première exécution construit les images Docker et le frontend, c'est la plus
longue. Les ports par défaut (`8000` pays, `8080` siège, `3000` frontend, `1883`
broker, `8025` Mailpit) se surchargent par les variables `E2E_*_PORT` pour tourner
à côté d'une stack qui occupe déjà les ports standards.

## Ce qui est couvert

Dix scénarios (chapitre 6 du dossier technique, E2E-01 à E2E-10) :

- une mesure remonte jusqu'au pays ;
- une valeur hors plage ouvre une alerte et envoie un email (capturé par Mailpit) ;
- un retour dans la plage résout l'alerte ;
- le silence d'un capteur est signalé (`sensor_error`) ;
- une coupure du broker met les mesures en buffer ;
- la synchro peuple le siège, l'`ack` purge les mesures confirmées ;
- le frontend liste les lots, ouvre le détail d'un lot, affiche les alertes.

## Fichiers

- `conftest.py` — fixtures : montage/démontage des stacks, passerelle, frontend.
- `docker-compose.yml` — pays + siège + broker + Mailpit + base PostgreSQL.
- `fake_sensor.py` — faux capteur pilotable au runtime (via un fichier d'état JSON).
- `test_e2e.py` — les dix scénarios.
- `requirements.txt` — pytest, playwright, requests, pyserial, paho-mqtt.
