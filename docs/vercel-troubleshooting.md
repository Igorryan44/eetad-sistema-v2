# Guia de Verificação do Deploy Vercel

## 📋 Checklist para Resolver o Problema de Deploy

### **1. Verificar se o Vercel está conectado à branch correta**
- Acesse: https://vercel.com/dashboard
- Vá em seu projeto EETAD
- Clique em **"Settings"** → **"Git"**
- ✅ Confirme que está usando a branch **"main"**
- ✅ Confirme que o repositório é **"Igorryan44/eetad-sistema-v2"**

### **2. Forçar um novo deploy manualmente**
Opção A - Via Dashboard:
- No dashboard do Vercel
- Vá na aba **"Deployments"**
- Clique em **"..." (três pontos)** no último deploy
- Clique em **"Redeploy"**

Opção B - Via CLI (se tiver instalado):
```bash
npx vercel --prod
```

### **3. Verificar logs de build**
- Na aba **"Deployments"**
- Clique no deploy mais recente
- Vá na aba **"Build Logs"**
- Procure por erros (linhas em vermelho)

### **4. Verificar configurações do projeto**
- Settings → **"General"**
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `dist`
- ✅ Install Command: `npm install`
- ✅ Framework Preset: `Vite`

### **5. Variáveis de ambiente (se necessário)**
- Settings → **"Environment Variables"**
- Adicione (se usar AI features):
  - `NEXT_PUBLIC_API_URL` = sua URL de produção
  - Outras conforme sua configuração

### **6. Verificar se o cache precisa ser limpo**
- Settings → **"Functions"**
- Ou force redeploy como mencionado no item 2

## 🔧 Comandos de emergência se nada funcionar:

```bash
# 1. Fazer um commit vazio para forçar deploy
git commit --allow-empty -m "trigger: Force Vercel deployment"
git push origin main

# 2. Se tiver Vercel CLI instalado
npm i -g vercel
vercel --prod

# 3. Verificar se build local funciona
npm run build
npm run preview
```

## 📱 Como verificar se deu certo:

1. Aguarde 2-5 minutos após o push
2. Acesse sua URL do Vercel
3. Abra DevTools (F12) → Console
4. Procure por erros
5. Teste o botão do AI Chatbot
6. ✅ Mobile: deve abrir WhatsApp
7. ✅ Desktop: deve abrir WhatsApp Web

## 🚨 Se ainda não funcionar:

Pode ser que o Vercel esteja com delay. Envie-me:
1. URL do seu projeto no Vercel
2. Screenshot dos logs de build
3. Mensagem de erro (se houver)

E eu te ajudo a resolver!