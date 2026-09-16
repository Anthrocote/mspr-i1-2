# Backend-local FutureKawa (pays exemple : Brésil)

Backend local d'un pays dans la chaîne de suivi des stocks de café vert FutureKawa :

```
IoT (capteur) → MQTT → BACKEND-LOCAL (ce module) → sync HTTP → backend-siège → frontend
```

Il consomme les mesures publiées par la passerelle IoT sur un broker MQTT local, les
persiste dans une base SQLite servant de **buffer**, lève des alertes (conditions de
stockage hors plage, lots périmés) avec envoi d'email au responsable du pays, et expose
les endpoints `/sync/*` que le backend-siège interroge pour consolider les données au
centre. La base locale ne conserve que le working-set vivant et la télémétrie non encore
confirmée par le siège : l'historique réel vit au siège.

## Architecture

Un seul conteneur applicatif Python (FastAPI/uvicorn) héberge, dans le même processus :

- l'**API REST** (gestion des lots + endpoints `/sync/*`), protégée par header `X-API-KEY` ;
- un **abonné MQTT** (paho, session persistante `clean_session=false`, QoS 1) dans un thread ;
- un **scheduler d'alerting** (tâche asyncio) qui vérifie périodiquement la péremption des lots.

Base **SQLite** en WAL (écrivain unique). Un second conteneur fournit le **broker Mosquitto**.
En production, l'app envoie les emails vers un vrai SMTP configuré par variables
d'environnement ; en démonstration locale, un conteneur **Mailpit** (override) capture les
emails et les affiche dans un navigateur.

## Démarrage rapide (démonstration)

Pré-requis : Docker + Docker Compose.

```bash
cd backend-local
cp .env.example .env
# éditer .env : au minimum API_KEY (doit correspondre à l'api_key du pays côté siège)
# Démo (Mailpit + seed) — surcouche explicite, jamais fusionnée automatiquement :
docker compose -f docker-compose.yml -f docker-compose.demo.yml up -d --build
```

Le compose de base (`docker-compose.yml`) est **prod-ready** : `docker compose up` seul
démarre l'app + Mosquitto avec un **vrai SMTP** (via env) et **sans seed**. La démo est une
surcouche **`docker-compose.demo.yml`** qu'il faut ajouter explicitement (`-f … -f …`) — elle
n'est **pas** un `override.yml` fusionné par défaut, pour qu'un `docker compose up` de
production ne bascule jamais en mode démo (Mailpit + données factices).

- API : http://localhost:8000 — `GET /health` répond `{"status":"ok"}`.
- Emails d'alerte capturés : http://localhost:8025 (interface web Mailpit).

Un **seed de démonstration** (activé uniquement par `SEED_DEMO=true`, posé par l'override
de démo) crée au premier démarrage un catalogue produit et deux lots, dont un de plus de
365 jours pour illustrer la péremption (statut `expired`). **En production `SEED_DEMO` reste
`false`** : la base démarre vide, aucune donnée factice n'est insérée.

Arrêt et nettoyage :

```bash
docker compose down -v
```

## Variables d'environnement

| Variable | Rôle | Défaut |
|---|---|---|
| `COUNTRY` | Code pays (seuils dérivés) : `br`, `ec`, `co` | `br` |
| `API_KEY` | Valeur attendue du header `X-API-KEY` (doit matcher le siège) | — |
| `DATABASE_URL` | Base SQLite | `sqlite:////data/backend-local.db` (conteneur) |
| `MQTT_BROKER` / `MQTT_PORT` | Broker MQTT | `mosquitto` / `1883` |
| `MQTT_CLIENT_ID` | Identité stable (session persistante) | `backend-local-br` |
| `EXPIRY_CHECK_INTERVAL_S` | Fréquence de vérification de la péremption | `3600` |
| `SEED_DEMO` | Insère le jeu de démonstration au démarrage (démo uniquement) | `false` |
| `SMTP_HOST` / `SMTP_PORT` | Serveur SMTP (vrai en prod, Mailpit en démo) | — / `587` |
| `SMTP_USER` / `SMTP_PASS` / `SMTP_STARTTLS` | Auth et chiffrement SMTP | — |
| `SMTP_FROM` | Expéditeur des emails | `alertes@futurekawa.local` |
| `ALERT_RECIPIENT` | Email du responsable d'exploitation du pays | — |

## Contrat MQTT consommé (imposé par le module IoT)

- Mesures : `futurekawa/{country}/{entrepot}/mesures`, QoS 1
  `{"temperature": float, "humidite": float, "mesure_le": "<ISO8601 UTC>", "device_id": "<str>"}`
- Statut : `futurekawa/{country}/{entrepot}/status`, QoS 1 retain — `online` / `offline` / `sensor_error`.

`{country}` et `{entrepot}` sont des codes courts. Le code entrepôt du topic est mappé vers un
entrepôt de la base dont l'UUID est **déterministe et stable** (`uuid5("{country}/{code}")`),
auto-créé à la première mesure d'un code inconnu. C'est cet UUID qui est exposé dans
`/sync/*`. Les mesures sont dédupliquées de façon idempotente sur `(device_id, mesure_le)`.
Le topic statut est informatif (persisté sur l'entrepôt) et ne déclenche pas d'alerte.

## API REST

Tous les endpoints (sauf `/health`) exigent le header `X-API-KEY`.

**Catalogue produits** (référence partagée par les lots)
- `POST /products` — créer une entrée catalogue `{code, name, description?, variety?}` (`code` unique, `409` si déjà pris).
- `GET /products` — lister le catalogue.

**Gestion des lots**
- `POST /lots` — enregistrer un lot à sa réception : `{product_uuid, quantity, warehouse_code, label?, arrived_at?}`. Le lot **référence un produit existant** du catalogue (`404` si le `product_uuid` est inconnu).
- `GET /lots` — liste triée par date de stockage (logique FIFO).
- `GET /lots/{uuid}` — détail d'un lot.
- `POST /lots/{uuid}/depart` `{shipment?: bool}` — le lot **quitte son entrepôt**. Par défaut (`shipment=false`) c'est le **début d'un transfert** : le lot passe **en transit** (`in_transit=true`), l'arrivée est déclarée ensuite. Avec `shipment=true`, c'est une **expédition hors du circuit** (sortie définitive, le lot devient terminal).
- `POST /lots/{uuid}/arrive` — **fin du transfert** `{warehouse_code}` : ouvre le stockage à l'entrepôt destination, sort du transit.

Un transfert est une opération longue : un lot **en transit** (parti mais pas encore arrivé) n'a aucun stockage ouvert mais **n'est pas terminal** — il n'est pas purgé par `/sync/ack`, contrairement à un lot expédié.

Le catalogue produit est une **donnée de référence persistante** (partagée entre lots, propagée au siège avec un `uuid` stable) : il n'est pas purgé par `/sync/ack`, contrairement aux mesures, alertes résolues et lots expédiés.

**Consultation**
- `GET /measurements?warehouse={code}` — mesures récentes d'un entrepôt.
- `GET /alerts` — alertes.

**Synchronisation siège**
- `GET /sync/products`, `GET /sync/lots`, `GET /sync/measurements`, `GET /sync/alerts` —
  n'exposent que les enregistrements non encore confirmés (`acked_at IS NULL`).
- Les **produits sont synchronisés séparément** ; `/sync/lots` ne porte que `product_uuid`
  (le lot lie son produit par uuid). Le siège doit donc **synchroniser les produits avant
  les lots** pour résoudre la référence.
- `POST /sync/ack` — corps `{"products":[...], "lots":[...], "measurements":[...], "alerts":[...]}` :
  le siège confirme les UUID durablement persistés. Le module marque ces enregistrements, puis
  **supprime** ceux devenus terminaux (mesure : toujours ; alerte : une fois résolue ; lot :
  une fois expédié — **jamais** un lot en transit). Les **produits sont marqués mais jamais
  supprimés** (catalogue de référence). Toute mutation ultérieure d'un lot ou d'une alerte
  réexpose l'enregistrement au tick suivant (`acked_at` remis à `NULL`).

## Règles d'alerting

Conditions idéales par pays, tolérance **±3 °C** / **±2 %** d'humidité :

| Pays | Température idéale | Humidité idéale |
|---|---|---|
| Brésil (`br`) | 29 °C | 55 % |
| Équateur (`ec`) | 31 °C | 60 % |
| Colombie (`co`) | 26 °C | 80 % |

- **Condition hors plage** (type `out_of_range`) — évaluée à chaque mesure. Une alerte est ouverte (avec envoi
  d'email) à la transition vers l'état hors plage ; une seule alerte reste active par
  entrepôt (anti-spam). Elle est résolue (avec envoi d'un second email) dès qu'une mesure
  revient dans la plage.
- **Lot périmé** (type `expired_lot`) — le scheduler vérifie toutes les `EXPIRY_CHECK_INTERVAL_S` secondes les
  lots dépassant 365 jours de stockage et lève une alerte (avec email) une fois par lot.

Contenu des emails (français) : type d'alerte, entrepôt (ou lot) concerné, valeurs
mesurées face aux seuils, horodatage.

## Tests

Suite pytest (logique métier + API, sans matériel) :

```bash
cd backend-local
python3.12 -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
pytest -v
```

Couverture : validation hors plage aux bornes, calcul de péremption, déduplication
idempotente, mapping topic → entrepôt, cycle ouverture/résolution des alertes, shapes
exactes des `/sync/*`, marquage et purge de `/sync/ack`, authentification `X-API-KEY`.

## Scénario de démonstration reproductible

Stack démo démarrée (`docker compose -f docker-compose.yml -f docker-compose.demo.yml up -d --build`, `API_KEY=demo` dans `.env`) :

```bash
# 1. Seed visible (dont le lot périmé) — après ~EXPIRY_CHECK_INTERVAL_S, statut "expired"
curl -s -H "X-API-KEY: demo" localhost:8000/sync/lots

# 2. Publier une mesure hors plage (température 45 °C au Brésil)
python - <<'PY'
import json
from datetime import datetime, timezone
import paho.mqtt.client as mqtt
c = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
c.connect("localhost", 1883, 60)
c.publish("futurekawa/br/entrepot-sao-paulo/mesures", json.dumps({
    "temperature": 45.0, "humidite": 55.0,
    "mesure_le": datetime.now(timezone.utc).isoformat(), "device_id": "uno-br-01"}), qos=1)
c.loop(timeout=1.0); c.disconnect()
PY

# 3. Mesure persistée + alerte (type out_of_range)
curl -s -H "X-API-KEY: demo" localhost:8000/sync/measurements
curl -s -H "X-API-KEY: demo" localhost:8000/sync/alerts

# 4. Email visible dans Mailpit : http://localhost:8025
```

Republier une mesure dans la plage (température 29 °C) résout l'alerte et envoie l'email de
retour à la normale.

## Liens

- README racine (architecture, ordre de démarrage) : [`../README.md`](../README.md)
- Backend siège (consomme `/sync/*`) : [`../backend-siege/README.md`](../backend-siege/README.md)
- Module IoT (produit le contrat MQTT consommé ici) : [`../iot/README.md`](../iot/README.md)
- Dossier technique argumenté : PDF dans [`../docs/`](../docs/)
