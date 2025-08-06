# ✅ CHECKLIST - Matrículas Pendentes

## 🔍 DIAGNÓSTICO ATUAL
- ✅ Planilha existe e está acessível
- ✅ Funções Supabase estão respondendo (HTTP 200)
- ❌ Retornando array vazio `[]`
- ❌ Função `check-student-cpf` com erro 500

## 📋 VERIFICAÇÕES OBRIGATÓRIAS

### 1. 🔐 CREDENCIAIS NO SUPABASE DASHBOARD
**Acesse:** https://supabase.com/dashboard → Settings → Environment Variables

Verifique se estas variáveis estão configuradas:

- [ ] **GOOGLE_SERVICE_ACCOUNT_EMAIL**
  - Formato: `nome@projeto.iam.gserviceaccount.com`
  - Exemplo: `eetad-sheets@meu-projeto-123456.iam.gserviceaccount.com`

- [ ] **GOOGLE_PRIVATE_KEY**
  - Deve começar com: `-----BEGIN PRIVATE KEY-----`
  - Deve terminar com: `-----END PRIVATE KEY-----`
  - Deve conter quebras de linha `\n`

### 2. 📊 ESTRUTURA DA PLANILHA
**Planilha:** `controle alunos`  
**Aba:** `dados pessoais`

Verifique se:

- [ ] A aba "dados pessoais" existe
- [ ] A **coluna 23** (índice 22) contém o campo **"status"**
- [ ] Existem registros com status = **"Pendente"** (exato, com P maiúsculo)
- [ ] Os dados estão organizados conforme a estrutura esperada:

```
A: Data Cadastro
B: Nome  
C: RG
D: CPF
E: Telefone
F: Email
...
W: STATUS ← Coluna 23 (índice 22)
```

### 3. 🔐 PERMISSÕES DA PLANILHA
Na planilha Google Sheets:

- [ ] Clique em **"Compartilhar"**
- [ ] Adicione o email da service account
- [ ] Defina permissão como **"Editor"** ou **"Viewer"**
- [ ] Confirme que o email foi adicionado com sucesso

### 4. 📊 LOGS DO SUPABASE
**Acesse:** https://supabase.com/dashboard → Edge Functions → get-pending-enrollments → Logs

Verifique se aparecem:

- [ ] `📋 Buscando matrículas pendentes...`
- [ ] `⚠️ Credenciais do Google não configuradas` (se aparecer = problema nas credenciais)
- [ ] `✅ Encontradas X matrículas pendentes` (se aparecer = funcionando)
- [ ] Erros de autenticação ou permissão

### 5. 🔄 REINICIAR FUNÇÕES
No Supabase Dashboard:

- [ ] Edge Functions → get-pending-enrollments → **Restart**
- [ ] Edge Functions → get-enrollments → **Restart**
- [ ] Edge Functions → check-student-cpf → **Restart**

### 6. ⏱️ AGUARDAR PROPAGAÇÃO
Após configurar as variáveis:

- [ ] Aguarde **2-3 minutos** para propagação
- [ ] Execute o teste novamente: `node testar-google-sheets-config.js`

## 🎯 TESTES DE VALIDAÇÃO

### Teste 1: Verificar Logs
```bash
# Execute e verifique os logs no Supabase Dashboard
node testar-google-sheets-config.js
```

### Teste 2: Verificar Função Específica
No navegador, acesse:
```
https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/get-pending-enrollments
```

### Teste 3: Verificar no Sistema
1. Acesse o sistema da secretaria
2. Vá em "Matrículas Pendentes"
3. Verifique se os alunos aparecem

## 🚨 PROBLEMAS MAIS COMUNS

### ❌ Array vazio mesmo com credenciais
**Causa:** Não há registros com status "Pendente"
**Solução:** Adicione pelo menos um registro na planilha com status = "Pendente"

### ❌ Erro 401/403
**Causa:** Problema de permissão
**Solução:** Compartilhar planilha com service account

### ❌ Erro 500
**Causa:** Credenciais inválidas ou malformadas
**Solução:** Reconfigurar GOOGLE_PRIVATE_KEY com quebras de linha corretas

### ❌ Logs mostram "Credenciais não configuradas"
**Causa:** Variáveis não estão no Supabase ou com nomes incorretos
**Solução:** Verificar nomes exatos das variáveis

## 📞 PRÓXIMOS PASSOS

1. **Execute este checklist item por item**
2. **Anote qual item falhou**
3. **Execute os testes após cada correção**
4. **Verifique os logs do Supabase em tempo real**

## 🔧 COMANDOS ÚTEIS

```bash
# Teste rápido
node testar-google-sheets-config.js

# Diagnóstico avançado
node diagnostico-avancado-google-sheets.js

# Teste de conexão
node testar-conexao-direta-sheets.js
```

---

**💡 DICA:** O problema mais comum é a estrutura da planilha ou a falta de registros com status "Pendente" na coluna correta.