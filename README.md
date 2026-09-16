# FutureKawa

Suivi des stocks de café vert multi-pays avec dispositif IoT. Des capteurs relèvent
la température et l'humidité dans les entrepôts du Brésil, de l'Équateur et de la
Colombie ; chaque pays consolide localement ses mesures, ses lots et ses alertes ;
le siège agrège les trois pays et sert une interface web de pilotage.

## Architecture

```
IoT (capteur DHT22 + passerelle) → MQTT → backend-local (un par pays)
        → sync HTTP → backend-siège (central) → frontend (web)
```

Le dossier technique argumenté (livrable 4, PDF dans `docs/`) détaille les choix
d'architecture. La documentation utilisateur, elle, est intégrée au frontend
(route `/aide`, voir plus bas).

## Composants

| Dossier | Rôle | Stack | Port |
|---|---|---|---|
| [`iot/`](iot/README.md) | Capteur + passerelle : relève et publie les mesures | Arduino UNO, Python | — (MQTT 1883) |
| [`backend-local/`](backend-local/README.md) | Backend d'un pays : buffer local, alerting, endpoints `/sync/*` | Python (FastAPI), SQLite, MQTT | 8000 |
| [`backend-siege/`](backend-siege/README.md) | Backend central : consolide les pays, sert le frontend | Symfony 7, PostgreSQL | 8080 |
| [`frontend/`](frontend/README.md) | Interface web du siège (lecture seule) | Next.js 16, React 19 | 3000 |
| [`e2e/`](e2e/README.md) | Suite de bout en bout, du faux capteur à l'écran | Python, pytest, Playwright | — |

## Prérequis globaux

- Docker et Docker Compose
- Node 22 (frontend)
- PHP 8.3 et Composer (backend-siège, hors Docker)
- Python 3.12 (backend-local, iot, e2e, hors Docker)

## Ordre de démarrage

La chaîne se monte de l'amont vers l'aval. Chaque commande est détaillée dans le
README du composant concerné.

1. **Backend pays** (au moins le Brésil, seul pays câblé pour une synchro réelle) :

   ```bash
   cd backend-local
   cp .env.example .env          # renseigner API_KEY
   docker compose -f docker-compose.yml -f docker-compose.demo.yml up -d --build
   ```

   API sur `http://localhost:8000`, emails d'alerte capturés par Mailpit sur
   `http://localhost:8025`.

2. **Backend siège** + migrations + fixtures :

   ```bash
   cd backend-siege
   docker compose up -d
   docker compose exec php bin/console doctrine:migrations:migrate
   docker compose exec php bin/console doctrine:fixtures:load
   ```

   API sur `http://localhost:8080`, documentation OpenAPI sur
   `http://localhost:8080/api/doc`. Les fixtures créent les trois pays ; seul le
   Brésil reçoit une URL et une clé de synchro (`PAYS_BR_API_URL` / `PAYS_BR_API_KEY`).

3. **Frontend** :

   ```bash
   cd frontend
   npm ci
   NEXT_PUBLIC_API_URL=http://localhost:8080/api npm run dev
   ```

   Interface sur `http://localhost:3000`.

## Variables d'environnement clés

| Variable | Composant | Rôle |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | frontend | URL de l'API du siège (défaut `http://localhost:8080/api`) |
| `COUNTRY` | backend-local | Code pays, dérive les seuils : `br`, `ec`, `co` |
| `API_KEY` | backend-local | Valeur attendue du header `X-API-KEY`, doit matcher la clé du pays côté siège |
| `PAYS_BR_API_URL` / `PAYS_BR_API_KEY` | backend-siège | URL et clé de synchro du backend pays (Brésil) |
| `DATABASE_URL` | backend-siège | Connexion PostgreSQL |
| `ALERT_RECIPIENT` | backend-local | Email du responsable du pays (destinataire des alertes) |
| `MQTT_BROKER` / `MQTT_PORT` | backend-local, iot | Broker MQTT |

## Démo complète

La suite [`e2e/`](e2e/README.md) monte toute la chaîne (pays + siège sur un réseau
Docker, faux capteur et frontend sur l'hôte) et vérifie le trajet d'une mesure
jusqu'à l'écran. C'est la façon la plus rapide de voir le système fonctionner de
bout en bout :

```bash
pytest e2e/
```

## Intégration continue

Les workflows GitHub Actions (`.github/workflows/`) exécutent, à chaque push et
pull request, les tests par composant (siège, pays, iot, frontend), la suite e2e,
puis un gate final ; `docker.yml` construit les images.

## Où trouver quoi

- **Dossier technique** (architecture, choix, annexes) : PDF dans `docs/`.
- **Documentation utilisateur** : intégrée au frontend, route `/aide` (centre
  d'aide trilingue fr/en/es) et bouton « ? » contextuel sur chaque page.
- **Documentation développeur** : ce README et les READMEs de chaque composant.
