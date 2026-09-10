# Design : Backend Siège — FutureKawa MSPR

**Date :** 2026-06-19
**Projet :** MSPR TPRE814 — FutureKawa
**Composant :** Backend central (siège)
**Statut :** Validé

---

## 1. Contexte

FutureKawa est une entreprise internationale de caféiculture opérant au Brésil, Équateur et Colombie. Le projet consiste à mettre en place un système de suivi des stocks et des conditions de stockage (IoT) multi-pays.

L'architecture est distribuée :
- **Backend local** (par pays) : buffer SQLite + MQTT + alertes email
- **Backend siège** (ce document) : agrégateur central PostgreSQL + API REST pour le frontend
- **Frontend** : React, hébergé au siège
- **IoT** : microcontrôleurs ESP32 + capteurs temp/humidité → MQTT

Le flux est **unidirectionnel** : pays → siège. Le siège ne pousse jamais de données vers les pays.

---

## 2. Stack technique

| Composant | Choix |
|---|---|
| Framework | Symfony 7.x LTS |
| PHP | 8.3 |
| Base de données | PostgreSQL 16 |
| ORM | Doctrine ORM |
| Auth frontend | JWT (`lexik/jwt-authentication-bundle`) |
| Auth inter-backend | API Key (header `X-API-KEY`) |
| HTTP Client | `symfony/http-client` |
| Sync automatique | `symfony/scheduler` |
| Emails alertes | `symfony/mailer` |
| Doc API | `nelmio/api-doc-bundle` + `zircote/swagger-php` |
| Conteneurisation | Docker + Docker Compose |
| Tests | PHPUnit (`symfony/test-pack`) |

**Packages exclus volontairement :** Twig, Form, Asset, Webpack Encore.

---

## 3. Structure du repository (monorepo)

```
mspr-i1-2/
├── backend-siege/      ← ce composant
├── backend-local/      ← backend pays (Symfony + SQLite)
├── frontend/           ← React
├── iot/                ← MicroPython / Arduino
└── docs/
```

### Structure interne `backend-siege/`

```
backend-siege/
├── src/
│   ├── Controller/         ← points d'entrée HTTP (thin controllers)
│   │   ├── Auth/
│   │   ├── PaysController.php
│   │   ├── EntrepotController.php
│   │   ├── ProduitController.php
│   │   ├── LotController.php
│   │   ├── MesureController.php
│   │   ├── AlerteController.php
│   │   └── SyncController.php
│   ├── Entity/             ← entités Doctrine avec contraintes Validator
│   │   ├── Pays.php
│   │   ├── Entrepot.php
│   │   ├── Produit.php
│   │   ├── Lot.php
│   │   ├── HistoriqueStockage.php
│   │   ├── Utilisateur.php
│   │   ├── Role.php
│   │   ├── Mesure.php
│   │   └── Alerte.php
│   ├── Repository/         ← requêtes Doctrine personnalisées
│   ├── Service/            ← logique métier
│   │   ├── Auth/
│   │   ├── Sync/
│   │   │   └── SyncService.php
│   │   └── Alerte/
│   ├── Security/
│   │   └── ApiKeyAuthenticator.php
│   ├── Scheduler/
│   │   └── SyncScheduler.php
│   └── DTO/                ← objets de transfert entrée/sortie
├── config/
├── migrations/
├── tests/
│   ├── Unit/               ← tests unitaires (Services)
│   └── Integration/        ← tests endpoints (WebTestCase)
├── docker/
│   ├── php/Dockerfile
│   └── nginx/default.conf
├── docker-compose.yml
└── .env.example
```

**Règles Symfony strictes :**
- Controllers : uniquement HTTP (validation requête → appel service → JsonResponse)
- Services : toute la logique métier
- Repositories : toutes les requêtes Doctrine (pas d'accès Doctrine dans les controllers)
- DTOs : découplage entités / représentation API
- Routing : attributs PHP `#[Route]` exclusivement

---

## 4. Modèle de données (PostgreSQL)

### Tables du schéma d'équipe (inchangées)

```
Produit { uuid PK, nom, description, variete, intensite, amertume, acidite, corps }
Role    { id PK, libelle }
Lot     { uuid PK, libelle, quantite, produit_id FK }
Entrepot { uuid PK, nom, numeroRue, adresse, code_postal, ville, pays_id FK, actif }
Historique_Stockage { lot_id PK FK, entrepot_id PK FK, date_arrivee, date_depart }
```

### Champs ajoutés sur tables existantes

```
Utilisateur → + password varchar(255) NOT NULL
Lot         → + statut varchar(20) NOT NULL DEFAULT 'conforme'
               + synced_at datetime NOT NULL
Pays        → + api_url varchar(255) NULL
               + api_key varchar(255) NULL
               + last_synced_at datetime NULL
               + temp_ideale float NULL
               + humidite_ideale float NULL
```

### Nouvelles tables

```
Mesure {
  uuid         UUID PK
  entrepot_id  UUID NOT NULL FK → Entrepot
  temperature  float NOT NULL
  humidite     float NOT NULL
  mesure_le    datetime NOT NULL    ← horodatage capteur
  synced_at    datetime NOT NULL    ← date de récupération par le siège
}

Alerte {
  uuid           UUID PK
  type           varchar(50) NOT NULL   ← 'condition_hors_plage' | 'lot_perime'
  lot_id         UUID NULL FK → Lot
  entrepot_id    UUID NULL FK → Entrepot
  declenchee_le  datetime NOT NULL
  resolue_le     datetime NULL
}
```

### Constantes de configuration (`.env`)

```
ALERT_TEMP_TOLERANCE=3
ALERT_HUMIDITY_TOLERANCE=2
```

Les tolérances sont identiques pour tous les pays (spec). Les conditions idéales (temp/humidité) sont spécifiques à chaque pays et stockées sur l'entité `Pays`.

### Valeurs idéales par pays (seed/fixtures)

| Pays | temp_ideale | humidite_ideale |
|---|---|---|
| Brésil | 29°C | 55% |
| Équateur | 31°C | 60% |
| Colombie | 26°C | 80% |

---

## 5. Authentification

### JWT (frontend → siège)
- Login : `POST /api/auth/login` → retourne `token` + `refresh_token`
- Toutes les routes `/api/*` (sauf login) requièrent `Authorization: Bearer <token>`
- Bundle : `lexik/jwt-authentication-bundle`

### API Key (scheduler interne → backends pays)
- Le `SyncService` ajoute `X-API-KEY: <valeur>` à chaque requête HTTP vers un backend pays
- La clé est stockée sur l'entité `Pays.api_key`
- Un `ApiKeyAuthenticator` Symfony protège les routes `/api/sync/*` pour les appels entrants éventuels

---

## 6. Synchronisation pays → siège

### Mécanisme
Le `SyncScheduler` (Symfony Scheduler) déclenche périodiquement le `SyncService` pour chaque pays actif.

Le `SyncService` :
1. Lit l'`api_url` et l'`api_key` du pays depuis PostgreSQL
2. Interroge le backend local du pays via HTTP (endpoints `/sync/lots`, `/sync/mesures`, `/sync/alertes`)
3. Persiste les données reçues dans PostgreSQL
4. Met à jour `Pays.last_synced_at`
5. Confirme la réception au backend local (qui peut alors purger son buffer SQLite)

### Résilience réseau
- Si un pays est injoignable, la sync échoue silencieusement (log + `last_synced_at` non mis à jour)
- Le frontend affiche `last_synced_at` pour indiquer la fraîcheur des données
- Le scheduler retente automatiquement au prochain tick

### Sync manuelle (admin)
`POST /api/sync/pays/{id}` déclenche le même `SyncService` à la demande (rôle `ROLE_ADMIN` requis).

---

## 7. Endpoints REST

Toutes les routes requièrent JWT sauf `POST /api/auth/login`.

### Authentification
```
POST   /api/auth/login              → public
POST   /api/auth/refresh
GET    /api/auth/me
```

### Pays
```
GET    /api/pays
GET    /api/pays/{id}
```

### Entrepôts
```
GET    /api/entrepots               ?pays_id=
GET    /api/entrepots/{uuid}
```

### Produits
```
GET    /api/produits
GET    /api/produits/{uuid}
```

### Lots
```
GET    /api/lots                    ?entrepot_id=, ?statut=, ?pays_id=, tri par date_arrivee (FIFO)
GET    /api/lots/{uuid}             → détail + historique stockage
```

### Mesures IoT
```
GET    /api/mesures                 ?entrepot_id=, ?from=, ?to=
GET    /api/entrepots/{uuid}/mesures
```

### Alertes
```
GET    /api/alertes                 ?type=, ?pays_id=
PATCH  /api/alertes/{uuid}/resolve
```

### Synchronisation (ROLE_ADMIN)
```
POST   /api/sync/pays/{id}
GET    /api/sync/status
```

---

## 8. Contraintes Validator

Toutes les entités et DTOs doivent porter des contraintes `symfony/validator` via attributs PHP :

- `#[Assert\NotBlank]` sur tous les champs obligatoires
- `#[Assert\Length(max: N)]` respectant les tailles du schéma
- `#[Assert\Email]` sur `Utilisateur.email`
- `#[Assert\Positive]` sur quantités et valeurs numériques
- `#[Assert\Choice]` sur `Lot.statut` (`conforme`, `en_alerte`, `perime`)
- `#[Assert\Choice]` sur `Alerte.type`
- `#[Assert\NotNull]` sur les clés étrangères obligatoires

---

## 9. Tests

| Type | Outil | Cible |
|---|---|---|
| Unitaires | PHPUnit | Services (SyncService, AlerteService…) |
| Intégration | WebTestCase Symfony | Endpoints REST (réponses HTTP, codes, structure JSON) |

Commande de lancement :
```bash
php bin/phpunit
```

---

## 10. Docker

### Services
- `php` : PHP 8.3-FPM Alpine
- `nginx` : reverse proxy
- `db` : PostgreSQL 16 Alpine

### Lancement
```bash
docker compose up -d
docker compose exec php bin/console doctrine:migrations:migrate
```

---

## 11. Extensibilité

Ajouter une route = ajouter une méthode avec `#[Route]` dans le controller concerné. Symfony la détecte par autowiring. Aucune configuration manuelle requise. La documentation OpenAPI (Nelmio) se met à jour automatiquement via les annotations `#[OA\*]`.
