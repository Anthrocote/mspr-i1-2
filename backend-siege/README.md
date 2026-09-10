# FutureKawa — Backend Siège

API REST Symfony 7.x — Backend central du système de suivi des stocks de café.

## Prérequis
- PHP 8.3+
- Composer
- Docker & Docker Compose

## Lancement (Docker)
```bash
docker compose up -d
docker compose exec php bin/console doctrine:migrations:migrate
docker compose exec php bin/console doctrine:fixtures:load
```

## Lancement (local)
```bash
composer install
cp .env.example .env  # puis adapter les variables
php bin/console doctrine:migrations:migrate
symfony server:start
```

## Tests
```bash
php bin/phpunit
```

## Documentation API
Disponible sur http://localhost:8080/api/doc après démarrage.
