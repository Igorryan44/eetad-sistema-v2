# Guia de Configuração das Variáveis de Ambiente no Vercel

## 📋 Variáveis Necessárias

### 🤖 AI Configuration
```
OPENAI_API_KEY=sk-proj-...
```

### 📱 WhatsApp Evolution API
```
EVOLUTION_API_URL=https://evolutionapi.eetadnucleopalmas.shop
EVOLUTION_API_KEY=2388E58BAB87-4844-9BC7-23B7182D09C8
EVOLUTION_INSTANCE_NAME=eetad
```

### 📊 Google Sheets API
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=seu-email@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA
```

### 🌐 URLs
```
NEXT_PUBLIC_API_URL=https://seu-dominio.vercel.app
```

## 🔧 Como Configurar no Vercel

### Via Dashboard:
1. Acesse https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em "Settings" → "Environment Variables"
4. Adicione cada variável:
   - **Name**: Nome da variável
   - **Value**: Valor da variável
   - **Environment**: Production (e Development se necessário)

### Via CLI:
```bash
vercel env add EVOLUTION_API_URL
# Digite o valor quando solicitado

vercel env add EVOLUTION_API_KEY
# Digite o valor quando solicitado

# Repetir para todas as variáveis
```

## 📝 Template .env (NÃO COMMITTAR)
```bash
# AI Configuration
OPENAI_API_KEY=sk-proj-...

# WhatsApp Evolution API
EVOLUTION_API_URL=https://evolutionapi.eetadnucleopalmas.shop
EVOLUTION_API_KEY=2388E58BAB87-4844-9BC7-23B7182D09C8
EVOLUTION_INSTANCE_NAME=eetad

# Google Sheets API
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEETS_SPREADSHEET_ID=1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA

# URLs
NEXT_PUBLIC_API_URL=https://seu-dominio.vercel.app
```

## ⚠️ Importante
- **GOOGLE_PRIVATE_KEY** deve incluir as quebras de linha (\n)
- Todas as keys devem estar protegidas
- Testar primeiro em ambiente de Development