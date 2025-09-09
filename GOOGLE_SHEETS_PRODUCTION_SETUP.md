# 📊 Google Sheets Production Setup Guide

Este guia explica como configurar o acesso direto ao Google Sheets em produção, permitindo que o sistema funcione sem servidor backend.

## 🎯 **Problema Resolvido**

Antes, o sistema dependia de um servidor local (localhost:3003) para acessar Google Sheets, o que não funciona em produção (Vercel). Agora o frontend pode acessar Google Sheets diretamente!

## ⚙️ **Configuração Rápida**

### **Opção 1: Interface Visual (Recomendado)**

1. **Acesse o sistema** após deploy
2. **Entre como Admin** (login: Admin, senha: admin1)  
3. **Vá em Configurações** → **Google Sheets**
4. **Siga as instruções** na tela para configurar API Key e ID da planilha
5. **Teste a conexão** para verificar se funcionou

### **Opção 2: Variáveis de Ambiente**

1. **Crie arquivo `.env.local`** na raiz do projeto:
```env
VITE_GOOGLE_SHEETS_API_KEY=sua_api_key_aqui
VITE_GOOGLE_SHEETS_SPREADSHEET_ID=id_da_sua_planilha
```

2. **Configure no Vercel** (se usando Vercel):
   - Dashboard → Settings → Environment Variables
   - Adicione as duas variáveis acima

## 🔑 **Como Obter Google Sheets API Key**

### **Passo 1: Google Cloud Console**
1. Acesse: https://console.cloud.google.com/
2. Crie um projeto ou use existente
3. Vá em **APIs & Services** → **Library**
4. Procure por **"Google Sheets API"** e **HABILITE**

### **Passo 2: Criar API Key**
1. Vá em **APIs & Services** → **Credentials**
2. Clique **"+ CREATE CREDENTIALS"** → **"API Key"**
3. **Copie a API Key** gerada (ex: `AIzaSy...`)
4. **Opcional**: Configure restrições para mais segurança

### **Passo 3: Configurar Permissões da Planilha**
1. Abra sua planilha Google Sheets
2. Clique **"Compartilhar"** (Share)
3. Altere para **"Qualquer pessoa com o link pode visualizar"**
4. Copie o **ID da planilha** da URL

**Exemplo de URL:**
```
https://docs.google.com/spreadsheets/d/1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA/edit
                                           ↑
                                    Este é o ID da planilha
```

## 📋 **Estrutura da Planilha Esperada**

O sistema espera encontrar estas abas na planilha:

### **Aba: "dados pessoais"**
- **Coluna G (índice 6)**: CPF do aluno
- **Coluna E (índice 4)**: Nome do aluno  
- **Coluna I (índice 8)**: Email do aluno
- **Coluna H (índice 7)**: Telefone do aluno

### **Outras abas suportadas:**
- `matriculas` - Dados de matrículas
- `pedidos` - Pedidos de livros
- `pagamentos` - Informações de pagamentos

## 🚀 **Como Funciona**

### **Em Desenvolvimento (localhost):**
- Sistema usa servidor backend local (localhost:3003)
- Acesso completo a todas as funcionalidades
- Google Sheets acessado via servidor Node.js

### **Em Produção (Vercel/Netlify):**
- Sistema detecta automaticamente que está em produção
- **CPF Verification**: Usa acesso direto ao Google Sheets via API
- **Outros serviços**: Usam localStorage + respostas simuladas
- **Fallback**: Se Google Sheets falhar, usa dados de demonstração

## 🔧 **Testando a Configuração**

### **Teste Local:**
```bash
# 1. Configure as variáveis no .env.local
# 2. Execute o projeto
npm run dev

# 3. Acesse Settings → Google Sheets
# 4. Clique "Testar Conexão"
```

### **Teste em Produção:**
1. **Faça deploy** no Vercel/Netlify
2. **Configure variáveis** de ambiente na plataforma
3. **Acesse o sistema** e teste CPF verification
4. **Verifique logs** no console do navegador

## 🐛 **Solução de Problemas**

### **Erro: "Failed to fetch" ou 403**
- ✅ Verifique se a API Key está correta
- ✅ Confirme que Google Sheets API está habilitada
- ✅ Certifique-se que a planilha está pública

### **Erro: "Spreadsheet not found"**
- ✅ Verifique se o ID da planilha está correto
- ✅ Confirme que a planilha não foi deletada
- ✅ Teste o link da planilha no navegador

### **CPF não encontrado mesmo existindo**
- ✅ Verifique se o CPF está na coluna G da aba "dados pessoais"
- ✅ Confirme que não há espaços ou caracteres especiais
- ✅ Use o formato limpo: apenas números (11 dígitos)

### **Fallback Mode (modo de segurança)**
Se a configuração falhar, o sistema ainda funciona com:
- CPFs de teste: `123.456.789-01`, `111.111.111-11`, `222.222.222-22`
- Dados simulados para demonstração
- Funcionalidades básicas mantidas

## 🔒 **Segurança**

### **API Key Protection:**
- 🔐 API Keys são armazenadas no localStorage (frontend)
- 🔐 Use restrições no Google Cloud Console
- 🔐 Monitore uso da API regularmente

### **Permissões Mínimas:**
- ✅ Planilha como "View only" (somente leitura)
- ✅ API Key com escopo limitado ao Google Sheets
- ✅ Sem permissões de escrita desnecessárias

## 📊 **Monitoramento**

### **Logs Úteis:**
```javascript
// No console do navegador, procure por:
'📱 Modo produção: acessando Google Sheets diretamente'
'✅ Student found in Google Sheets'
'🔄 Using fallback response for CPF verification'
```

### **Métricas Google Cloud:**
- Monitore uso da API no Google Cloud Console
- Verifique quotas e limites
- Configure alertas se necessário

## 🎉 **Benefícios da Nova Solução**

✅ **Funciona em produção** sem servidor backend  
✅ **Acesso real ao Google Sheets** em produção  
✅ **Fallback automático** se houver problemas  
✅ **Configuração visual** fácil via interface  
✅ **Suporte a ambiente híbrido** (dev + prod)  
✅ **Logs detalhados** para debugging  
✅ **Zero dependência** de localhost em produção  

---

**📞 Suporte:** Se tiver problemas, verifique os logs do console e use a interface de configuração visual no menu de administração.