#!/bin/bash

echo "🚀 Forçando inicialização do Laravel..."

# 1. Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cat > .env << EOF
APP_NAME=Laravel
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=desafio_auth
DB_USERNAME=appuser
DB_PASSWORD=appsecret

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="\${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1

VITE_APP_NAME="\${APP_NAME}"
VITE_PUSHER_APP_KEY="\${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="\${PUSHER_HOST}"
VITE_PUSHER_PORT="\${PUSHER_PORT}"
VITE_PUSHER_SCHEME="\${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="\${PUSHER_APP_CLUSTER}"
EOF
    echo "✅ Arquivo .env criado!"
fi

# 2. Gerar chave da aplicação
echo "🔑 Gerando chave da aplicação..."
php artisan key:generate --force

# 3. Aguardar um pouco para o MySQL
echo "⏳ Aguardando MySQL..."
sleep 15

# 4. Executar migrações (força)
echo "🗄️ Executando migrações..."
php artisan migrate --force

# 5. Executar seeders (força)
echo "🌱 Executando seeders..."
php artisan db:seed --force

echo "🎉 Inicialização forçada concluída!"
echo "👤 Usuário demo: demo@demo.com / 123456"
