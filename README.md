# TechX - Sistema de Gerenciamento de Tarefas

Sistema completo de gerenciamento de tarefas com autenticação, auditoria e interface moderna.

## Tecnologias Utilizadas

### Backend
- **Laravel** - API de autenticação (PHP 8.2)
- **Node.js** - API de tarefas (TypeScript)
- **MySQL** - Banco de dados principal
- **MongoDB** - Banco de auditoria
- **Prisma** - ORM para Node.js

### Frontend
- **Angular 18** - Framework SPA
- **Tailwind CSS** - Estilização
- **ngx-toastr** - Notificações

### Infraestrutura
- **Docker** - Containerização
- **Docker Compose** - Orquestração
- **Nginx** - Proxy reverso

## Pré-requisitos

- Docker e Docker Compose instalados
- Git
- 4GB RAM disponível
- Portas 3001, 8000 e 8080 livres

## Como Executar

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd desafio-essentia-tecnologies
```

### 2. Execute o projeto
```bash
# Inicia todos os serviços
docker-compose up -d

# Verifica se todos os containers estão rodando
docker-compose ps
```

### 3. Aguarde a inicialização
```bash
# Monitore os logs (opcional)
docker-compose logs -f
```

## Acessos

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:8080 | Interface principal |
| **API Laravel** | http://localhost:8000 | Autenticação |
| **API Node** | http://localhost:3001 | Tarefas e Auditoria |

## Credenciais de Teste

```
Email: demo@demo.com
Senha: 123456
```

## Funcionalidades

### Autenticação
- Login seguro com JWT
- Proteção de rotas
- Interceptor automático

### Gerenciamento de Tarefas
- Criar, editar e excluir tarefas
- Marcar como concluída/pendente
- Busca e filtros
- Paginação

### Sistema de Auditoria
- Histórico completo de mudanças
- Rastreamento de alterações
- Interface visual clara
- Dados salvos no MongoDB

### Interface Moderna
- Design responsivo
- Notificações em tempo real
- UX otimizada
- Cores e indicadores visuais

## Comandos Úteis

### Gerenciamento de Containers
```bash
# Parar todos os serviços
docker-compose down

# Reiniciar um serviço específico
docker-compose restart api-node

# Ver logs de um serviço
docker-compose logs api-node

# Reconstruir um serviço
docker-compose build frontend
```

### Banco de Dados
```bash
# Acessar MySQL
docker exec -it mysql mysql -u appuser -p
# Senha: appsecret

# Acessar MongoDB
docker exec -it mongo mongosh
```

### Desenvolvimento
```bash
# Reconstruir tudo
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Solução de Problemas

### Erro 403 no Frontend
```bash
docker-compose restart frontend
```

### Erro 401 na API
- Verifique se está logado
- Limpe o localStorage do navegador
- Faça login novamente

### Containers não iniciam
```bash
# Verifique se as portas estão livres
netstat -an | findstr :8080
netstat -an | findstr :8000
netstat -an | findstr :3001

# Limpe containers antigos
docker system prune -f
```

### Problemas de Banco
```bash
# Reset completo dos bancos
docker-compose down -v
docker-compose up -d
```

## Estrutura do Projeto

```
desafio-essentia-tecnologies/
├── backend/
│   ├── auth-laravel/          # API de autenticação
│   └── api-node/             # API de tarefas
├── frontend/                  # Interface Angular
├── docker/                   # Configurações Nginx
├── docker-compose.yml        # Orquestração
└── README.md                 # Este arquivo
```

## Monitoramento

### Verificar Status
```bash
# Status dos containers
docker-compose ps

# Uso de recursos
docker stats

# Logs em tempo real
docker-compose logs -f --tail=50
```

### Health Checks
- Frontend: http://localhost:8080
- Laravel: http://localhost:8000
- Node API: http://localhost:3001/health

## Notas Importantes

- **Primeira execução**: Pode demorar alguns minutos para baixar as imagens
- **Dados**: São persistidos em volumes Docker
- **Desenvolvimento**: Use `docker-compose logs -f` para debug
- **Produção**: Configure variáveis de ambiente adequadas

## Suporte

Se encontrar problemas:

1. Verifique se todas as portas estão livres
2. Execute `docker-compose logs` para ver erros
3. Reinicie os serviços: `docker-compose restart`
4. Em último caso: `docker-compose down -v && docker-compose up -d`

---

**Desenvolvido para Essentia Technologies**