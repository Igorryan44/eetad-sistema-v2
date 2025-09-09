# 🚀 Guia de Deploy - EETAD Sistema v2

## 📋 **Pré-requisitos**

- ✅ Conta no Vercel (gratuita)
- ✅ Conta no GitHub (para repositório)
- ✅ Projeto buildado (`npm run build`)

---

## 🌐 **Deploy no Vercel (Recomendado)**

### **Passo 1: Preparar o Repositório**

```bash
# 1. Fazer commit das alterações
git add .
git commit -m "Preparando para deploy"
git push origin main
```

### **Passo 2: Deploy no Vercel**

1. **Acesse:** https://vercel.com
2. **Conecte sua conta GitHub**
3. **Import Project:**
   - Selecione o repositório `eetad-sistema-v2`
   - Framework: **Vite**
   - Root Directory: `/` (raiz)
   - Build Command: `npm run build`
   - Output Directory: `dist`

### **Passo 3: Configurar Variáveis de Ambiente**

No painel do Vercel, vá em **Settings > Environment Variables** e adicione:

```env
# Frontend (VITE_*)
VITE_API_BASE_URL=https://sua-api-backend.herokuapp.com
VITE_GOOGLE_SHEETS_API_KEY=AIzaSyB7U8K9uX8p7uX8p7uX8p7uX8p7uX8p7uX8
VITE_GOOGLE_SHEETS_SPREADSHEET_ID=1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA
VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL=puppeteer-service-account@testen8n-448514.iam.gserviceaccount.com
VITE_GOOGLE_PRIVATE_KEY="SUA_CHAVE_PRIVADA_GOOGLE_AQUI"

# Backend (para serverless functions)
GOOGLE_SHEETS_SPREADSHEET_ID=1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA
GOOGLE_SERVICE_ACCOUNT_EMAIL=puppeteer-service-account@testen8n-448514.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="SUA_CHAVE_PRIVADA_GOOGLE_AQUI"

# WhatsApp/Evolution API
EVOLUTION_API_URL=https://evolutionapi.eetadnucleopalmas.shop
EVOLUTION_API_KEY=2388E58BAB87-4844-9BC7-23B7182D09C8
EVOLUTION_INSTANCE_NAME=eetad
SECRETARY_WHATSAPP_NUMBER=5563985112006

# OpenAI (opcional)
OPENAI_API_KEY=SUA_CHAVE_OPENAI_AQUI

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-349178540939718-050307-092eeef435f701b0453368303a33c530-82713024
CHAVE_PIX_ESTATICA=simacjr@gmail.com
```

### **Passo 4: Deploy**

1. **Clique em "Deploy"**
2. **Aguarde o build** (2-3 minutos)
3. **Acesse sua URL:** `https://seu-projeto.vercel.app`

---

## 🔧 **Deploy do Backend (Opcional)**

### **Opção A: Heroku (Gratuito)**

```bash
# 1. Instalar Heroku CLI
# 2. Login
heroku login

# 3. Criar app
cd local-server
heroku create eetad-backend-api

# 4. Configurar variáveis
heroku config:set GOOGLE_SHEETS_SPREADSHEET_ID=1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA
heroku config:set GOOGLE_SERVICE_ACCOUNT_EMAIL=puppeteer-service-account@testen8n-448514.iam.gserviceaccount.com
heroku config:set GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# 5. Deploy
git subtree push --prefix=local-server heroku main
```

### **Opção B: Railway**

1. **Acesse:** https://railway.app
2. **Connect GitHub**
3. **Deploy from GitHub**
4. **Selecione:** `local-server` folder
5. **Configure variáveis** no painel

---

## 📱 **Deploy Alternativo: Netlify**

### **Passo 1: Build Local**

```bash
npm run build
```

### **Passo 2: Deploy Manual**

1. **Acesse:** https://netlify.com
2. **Drag & Drop** da pasta `dist`
3. **Configure variáveis** em Site Settings > Environment Variables

### **Passo 3: Deploy Automático**

1. **Connect GitHub**
2. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`

---

## ✅ **Verificação Pós-Deploy**

### **Testes Essenciais:**

1. **✅ Frontend carrega**
2. **✅ Validação de CPF funciona**
3. **✅ Conexão com Google Sheets**
4. **✅ WhatsApp + IA integrado**
5. **✅ Responsivo (mobile/desktop)**

### **URLs de Teste:**

- **Frontend:** `https://seu-projeto.vercel.app`
- **Health Check:** `https://seu-projeto.vercel.app/api/health`
- **WhatsApp Webhook:** `https://seu-projeto.vercel.app/api/whatsapp-webhook`

---

## 🚨 **Troubleshooting**

### **Erro: "Module not found"**
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
npm run build
```

### **Erro: "Environment variables not found"**
- Verificar se todas as variáveis estão configuradas no Vercel
- Verificar se o prefixo `VITE_` está correto para variáveis do frontend

### **Erro: "CORS"**
- Verificar configuração de CORS no backend
- Adicionar domínio de produção nas configurações

---

## 🎯 **Próximos Passos**

1. **✅ Deploy no Vercel**
2. **✅ Configurar domínio personalizado** (opcional)
3. **✅ Configurar SSL/HTTPS** (automático no Vercel)
4. **✅ Monitoramento** (Vercel Analytics)
5. **✅ Backup** (GitHub + Vercel)

---

**🚀 Seu sistema estará online em poucos minutos!**
