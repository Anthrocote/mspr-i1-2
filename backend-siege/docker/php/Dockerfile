FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    icu-dev

RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    zip \
    intl \
    opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/app

COPY . .

# Build the production image: the committed .env defaults to APP_ENV=dev, but a
# --no-dev install drops the dev-only bundles (fixtures, maker), so the post-install
# cache:clear must run in prod or it fails on a now-missing bundle class.
ENV APP_ENV=prod
ENV APP_DEBUG=0

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN chmod -R 777 var/

EXPOSE 9000
