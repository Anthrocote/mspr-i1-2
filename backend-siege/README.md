# FutureKawa — Backend Siège

API REST Symfony 7 — backend central du suivi des stocks de café vert. Il consolide
les données des backends pays et sert le frontend.

## Place dans la chaîne

Le siège **tire** les données de chaque backend pays via ses endpoints `/sync/*`
(authentifiés par `X-API-KEY`), les persiste dans PostgreSQL, et **expose** l'API
`/api/*` que le frontend consomme en lecture. La configuration de chaque pays (URL
de synchro + clé) vit dans la table `pays`.

```
backend-local (pays)  →  [pull /sync/*]  →  backend-siège  →  [/api/*]  →  frontend
```

## Prérequis

- PHP 8.3+
- Composer
- Docker et Docker Compose

## Lancement (Docker)

```bash
docker compose up -d
docker compose exec php bin/console doctrine:migrations:migrate
docker compose exec php bin/console doctrine:fixtures:load
```

## Lancement (local)

```bash
composer install
cp .env.example .env        # puis adapter les variables
php bin/console doctrine:migrations:migrate
symfony server:start
```

## Migrations et fixtures

- `doctrine:migrations:migrate` construit le schéma.
- `doctrine:fixtures:load` amorce les trois pays (Brésil, Équateur, Colombie) avec
  leurs seuils idéaux. Seul le Brésil reçoit une URL et une clé de synchro (via
  `PAYS_BR_API_URL` / `PAYS_BR_API_KEY`) : c'est le pays instrumenté d'exemple.

## API

Toutes les routes sont préfixées `/api`. Aperçu par ressource :

| Ressource | Routes |
|---|---|
| Santé | `GET /api/health` |
| Pays | `GET /api/countries`, `GET /api/countries/{code}` |
| Exploitations | `GET /api/exploitations`, `GET /api/exploitations/{uuid}` |
| Entrepôts | `GET /api/warehouses`, `GET /api/warehouses/{uuid}`, `GET /api/warehouses/{uuid}/measurements` |
| Mesures | `GET /api/measurements` |
| Produits | `GET /api/products`, `GET /api/products/{uuid}` |
| Lots | `GET /api/lots`, `GET /api/lots/{uuid}` |
| Alertes | `GET /api/alerts`, `PATCH /api/alerts/{uuid}/resolve` |
| Synchro | `POST /api/sync/countries/{code}`, `GET /api/sync/status` |

`POST /api/sync/countries/{code}` déclenche (de façon asynchrone, via Messenger) une
synchronisation qui tire les données du backend pays ; `GET /api/sync/status` donne
l'état de synchro par pays. Le détail des schémas de requête et de réponse est décrit
par les annotations OpenAPI et rendu par la documentation interactive.

## Documentation OpenAPI

Disponible sur `http://localhost:8080/api/doc` après démarrage. Le dossier technique
(annexe A) reprend le contrat d'API.

## Configuration (env)

| Variable | Rôle |
|---|---|
| `APP_ENV` | Environnement Symfony (`prod` / `dev`) |
| `DATABASE_URL` | Connexion PostgreSQL |
| `PAYS_BR_API_URL` / `PAYS_BR_API_KEY` | URL et clé de synchro du pays Brésil (injectées dans la table `pays` par les fixtures) |
| `ALERT_TEMP_TOLERANCE` / `ALERT_HUMIDITY_TOLERANCE` | Tolérances appliquées aux seuils (±3 °C / ±2 %) |
| `MAILER_DSN` | Transport mail |

## Tests

```bash
php bin/phpunit
```

## Liens

- README racine : [`../README.md`](../README.md)
- Backend pays : [`../backend-local/README.md`](../backend-local/README.md)
- Frontend : [`../frontend/README.md`](../frontend/README.md)
