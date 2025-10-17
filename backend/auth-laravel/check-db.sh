#!/bin/bash

echo "🔍 Verificando status do banco de dados..."

# Testa conexão
echo "📡 Testando conexão..."
php artisan migrate:status > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Conexão com banco OK"
else
    echo "❌ Erro de conexão com banco"
    exit 1
fi

# Verifica se tabelas existem
echo "🗄️ Verificando tabelas..."
php artisan tinker --execute="echo 'Tabelas: '; DB::select('SHOW TABLES');" 2>/dev/null

# Verifica se usuário demo existe
echo "👤 Verificando usuário demo..."
php artisan tinker --execute="echo 'Usuários: '; App\Models\User::count();" 2>/dev/null

echo "✅ Verificação concluída!"
