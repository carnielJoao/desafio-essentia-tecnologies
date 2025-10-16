# Etapa 1: Composer
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-ansi --no-scripts --prefer-dist
# Copia projeto para otimizar autoload depois
COPY . .
RUN composer dump-autoload --optimize

# Etapa 2: PHP-FPM
FROM php:8.2-fpm
WORKDIR /var/www/html

# Extensões necessárias
RUN apt-get update && apt-get install -y \
    libzip-dev zip unzip libpng-dev libonig-dev libxml2-dev git \
 && docker-php-ext-install pdo pdo_mysql mbstring zip exif pcntl bcmath

# Copia vendor da etapa anterior
COPY --from=vendor /app /var/www/html

# Permissões básicas
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Expor PHP-FPM
EXPOSE 9000

CMD ["php-fpm"]
