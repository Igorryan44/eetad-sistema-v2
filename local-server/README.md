# 🏠 Servidor Local - EETAD Sistema v2

Servidor Express.js local para hospedar as funções migradas do Supabase Edge Functions.

## 🚀 Início Rápido

### 1. Configuração Inicial
```bash
# Instalar dependências e executar migração
npm run setup

# Configurar credenciais do Google (interativo)
npm run setup-credentials
```

### 2. Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp ../.env.local.example ../.env.local

# Editar com suas credenciais reais
# Especialmente importante:
# - GOOGLE_SERVICE_ACCOUNT_EMAIL
# - GOOGLE_PRIVATE_KEY  
# - GOOGLE_SHEETS_SPREADSHEET_ID
```

### 3. Iniciar Servidor
```bash
npm start
```

Servidor disponível em: `http://localhost:3001`

## 📋 Funções Disponíveis

| Função | Endpoint | Status |
|--------|----------|--------|
| Finalizar Matrícula | `/finalize-enrollment` | ✅ Migrada |
| Matrículas Pendentes | `/get-pending-enrollments` | ✅ Migrada |
| Listar Matrículas | `/get-enrollments` | ✅ Migrada |
| Salvar Dados Pessoais | `/save-student-personal-data` | ✅ Migrada |
| Salvar Registro | `/save-student-registration` | 🚧 Template |
| Criar Pagamento MP | `/create-mercadopago-payment` | 🚧 Template |
| Status Pagamento | `/check-payment-status` | 🚧 Template |
| Webhook MP | `/mercadopago-webhook` | 🚧 Template |
| Gerenciar Usuários | `/manage-secretary-users` | 🚧 Template |
| AI Chatbot | `/ai-chatbot` | 🚧 Template |

## 🔧 Scripts Disponíveis

```bash
npm start              # Iniciar servidor
npm run dev            # Desenvolvimento (auto-reload)
npm test               # Testar todas as funções
npm run migrate        # Migrar funções do Supabase
npm run setup          # Configuração inicial completa
npm run setup-credentials  # Configurar credenciais Google
```

## 🧪 Testes

### Testar Todas as Funções
```bash
npm test
```

### Testar Função Específica
```bash
curl http://localhost:3001/finalize-enrollment/health
```

### Testar Health Check Geral
```bash
curl http://localhost:3001/health
```

## 📁 Estrutura

```
local-server/
├── index.js                 # Servidor principal
├── package.json             # Dependências e scripts
├── functions/               # Funções migradas
│   ├── finalize-enrollment.js
│   ├── get-pending-enrollments.js
│   └── ...
├── utils/                   # Utilitários
│   ├── google-auth.js       # Autenticação Google
│   └── cors.js              # Configuração CORS
└── scripts/                 # Scripts de automação
    ├── migrate-functions.js
    ├── test-functions.js
    └── setup-google-credentials.js
```

## 🔐 Segurança

- Rate limiting configurado
- Headers de segurança (Helmet)
- CORS configurado para origens específicas
- Validação de credenciais
- Logs de segurança

## 🌐 Integração com Frontend

### URLs para Configurar no Frontend

**Desenvolvimento:**
```javascript
const API_BASE_URL = 'http://localhost:3001';
```

**Produção:**
```javascript
const API_BASE_URL = 'https://seu-servidor-producao.com';
```

### Exemplo de Uso
```javascript
// Finalizar matrícula
const response = await fetch(`${API_BASE_URL}/finalize-enrollment`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    studentId: '123',
    course: 'Curso Exemplo'
  })
});
```

## 🐛 Troubleshooting

### Servidor não inicia
1. Verificar se a porta 3001 está livre
2. Verificar se as dependências estão instaladas: `npm install`
3. Verificar arquivo `.env.local`

### Credenciais do Google inválidas
1. Executar: `npm run setup-credentials`
2. Verificar se a conta de serviço tem acesso à planilha
3. Verificar formato da chave privada

### Função retorna erro 500
1. Verificar logs do servidor
2. Testar health check: `/nome-funcao/health`
3. Verificar variáveis de ambiente necessárias

## 📚 Documentação Completa

Consulte o arquivo `../MIGRACAO-LOCAL.md` para documentação completa da migração.

## 🤝 Contribuição

1. Faça suas alterações
2. Teste com `npm test`
3. Documente mudanças
4. Submeta PR

## 📞 Suporte

Para dúvidas sobre a migração ou configuração, consulte:
- Documentação: `MIGRACAO-LOCAL.md`
- Logs do servidor: Console do terminal
- Health checks: `http://localhost:3001/health`