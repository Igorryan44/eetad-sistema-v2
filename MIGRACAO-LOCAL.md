# 🏠 Migração para Ambiente Local

Este guia explica como migrar as credenciais e funções do Supabase para execução local.

## 📋 Pré-requisitos

1. **Docker Desktop** - Para rodar o Supabase localmente
2. **Node.js** - Para executar scripts locais
3. **Supabase CLI** - Para gerenciar o ambiente local

## 🔧 Configuração do Ambiente Local

### 1. Instalar Docker Desktop

```bash
# Baixe e instale o Docker Desktop do site oficial
# https://www.docker.com/products/docker-desktop/
```

### 2. Configurar Supabase Local

```bash
# Inicializar Supabase local
supabase init

# Iniciar serviços locais
supabase start
```

### 3. Configurar Variáveis de Ambiente Locais

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase Local
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Google Sheets (suas credenciais reais)
GOOGLE_SERVICE_ACCOUNT_EMAIL=seu-email@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_PRIVADA_AQUI\n-----END PRIVATE KEY-----"
GOOGLE_SHEETS_SPREADSHEET_ID=1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=seu_token_aqui

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_app
FROM_EMAIL=seu_email@gmail.com
FROM_NAME=EETAD - Núcleo Palmas TO

# WhatsApp
EVOLUTION_API_URL=sua_url_evolution
EVOLUTION_API_KEY=sua_chave_evolution
EVOLUTION_INSTANCE_NAME=sua_instancia
SECRETARY_WHATSAPP_NUMBER=5563999999999

# OpenAI
OPENAI_API_KEY=sua_chave_openai
```

## 🚀 Estrutura de Migração

### 1. Servidor Local de Funções

Vou criar um servidor Express local que replica as funções do Supabase:

```
local-server/
├── index.js              # Servidor principal
├── functions/             # Funções migradas
│   ├── finalize-enrollment.js
│   ├── get-enrollments.js
│   ├── get-pending-enrollments.js
│   └── ...
├── utils/                 # Utilitários compartilhados
│   ├── google-auth.js
│   ├── cors.js
│   └── jwt.js
└── package.json
```

### 2. Configuração de Credenciais Local

As credenciais serão gerenciadas através de:
- Arquivo `.env.local` para desenvolvimento
- Variáveis de ambiente do sistema
- Arquivo de configuração JSON criptografado (opcional)

## 📁 Estrutura de Arquivos Criados

1. **local-server/** - Servidor local das funções
2. **scripts/migrate-to-local.js** - Script de migração automática
3. **scripts/test-local-functions.js** - Testes das funções locais
4. **config/local-config.json** - Configurações locais
5. **.env.local** - Variáveis de ambiente locais

## 🔄 Processo de Migração

### Automático
```bash
npm run migrate-local
```

### Manual
1. Configurar Docker e Supabase local
2. Copiar funções para servidor local
3. Configurar variáveis de ambiente
4. Testar funções localmente
5. Atualizar frontend para usar URLs locais

## 🧪 Testes

```bash
# Testar todas as funções locais
npm run test-local

# Testar função específica
npm run test-local finalize-enrollment
```

## 📊 Monitoramento

O servidor local incluirá:
- Logs detalhados
- Dashboard de status
- Métricas de performance
- Interface de debug

## 🔒 Segurança

- Credenciais criptografadas
- Validação de JWT local
- Rate limiting
- Logs de auditoria

## 🌐 Integração com Frontend

O frontend será configurado para detectar automaticamente se está rodando localmente e usar as URLs apropriadas:

```javascript
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001/functions'
  : 'https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1';
```

## 🚀 Execução

### Configuração Inicial (Primeira vez)
```bash
# 1. Instalar dependências e executar migração
cd local-server
npm run setup

# 2. Configurar credenciais do Google (interativo)
npm run setup-credentials

# 3. Copiar e configurar arquivo de ambiente
cp ../.env.local.example ../.env.local
# Edite .env.local com suas credenciais reais
```

### Iniciar Servidor Local
```bash
cd local-server
npm start
```

O servidor estará disponível em: `http://localhost:3001`

### Testar Funções
```bash
npm test
```

### Desenvolvimento (auto-reload)
```bash
npm run dev
```

### Scripts Disponíveis
- `npm start` - Iniciar servidor de produção
- `npm run dev` - Iniciar com nodemon (auto-reload)
- `npm test` - Testar todas as funções
- `npm run migrate` - Executar migração das funções
- `npm run setup` - Configuração inicial completa
- `npm run setup-credentials` - Configurar credenciais do Google

## ✅ Status da Migração

### Funções Migradas com Sucesso
| Função | Status | Descrição |
|--------|--------|-----------||
| `finalize-enrollment` | ✅ Completa | Finalizar matrícula de aluno |
| `get-pending-enrollments` | ✅ Completa | Buscar matrículas pendentes |
| `get-enrollments` | ✅ Completa | Listar matrículas efetivadas |
| `save-student-personal-data` | ✅ Completa | Salvar dados pessoais |
| `save-student-registration` | 🚧 Template | Salvar registro do aluno |
| `create-mercadopago-payment` | 🚧 Template | Criar pagamento MP |
| `check-payment-status` | 🚧 Template | Verificar status pagamento |
| `mercadopago-webhook` | 🚧 Template | Webhook MercadoPago |
| `manage-secretary-users` | 🚧 Template | Gerenciar usuários |
| `ai-chatbot` | 🚧 Template | Chatbot com IA |
| `cancel-order` | ✅ Completa | Cancelar pedido |
| `send-email-notification` | ✅ Completa | Enviar notificações |

### Servidor Local
- ✅ **Porta**: 3003 (configurável)
- ✅ **CORS**: Configurado para desenvolvimento
- ✅ **Segurança**: Rate limiting e headers
- ✅ **Health Checks**: Disponíveis para todas as funções
- ✅ **Dashboard**: Interface web simples
- ✅ **Logs**: Sistema de logging implementado

### Utilitários
- ✅ **Google Auth**: Autenticação e acesso ao Sheets
- ✅ **CORS Utils**: Configuração centralizada
- ✅ **Scripts**: Migração, teste e configuração

## 📝 Próximos Passos

1. **Configurar Credenciais**: 
   ```bash
   npm run setup-credentials
   ```

2. **Testar Funções**: 
   ```bash
   npm test
   ```

3. **Configurar Frontend**: Atualizar URLs para `http://localhost:3003/functions/`

4. **Implementar Templates**: Completar funções marcadas como 🚧

5. **Deploy Produção**: Configurar servidor de produção quando necessário

## 🔧 Troubleshooting

### Problemas Comuns
- **Porta em uso**: Alterar `LOCAL_SERVER_PORT` no `.env.local`
- **Credenciais inválidas**: Executar `npm run setup-credentials`
- **CORS errors**: Verificar configuração de origens permitidas
- **Timeout Google**: Verificar conectividade e quotas da API

### Logs e Debug
- Logs do servidor: Console do terminal
- Health checks: `http://localhost:3003/health`
- Função específica: `http://localhost:3003/functions/nome-funcao/health`
- Dashboard: `http://localhost:3003`

### URLs de Teste
```bash
# Health check geral
curl http://localhost:3003/health

# Testar função específica
curl http://localhost:3003/functions/finalize-enrollment/health

# Dashboard web
http://localhost:3003
```