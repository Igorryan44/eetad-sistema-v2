# 🔧 SOLUÇÃO: Matrículas Pendentes Não Aparecem

## 📋 PROBLEMA IDENTIFICADO

A funcionalidade "Matrículas Pendentes" no ambiente da secretaria não está listando os alunos cadastrados porque **as variáveis de ambiente do Google Sheets não estão configuradas no Supabase Dashboard**.

## 🔍 DIAGNÓSTICO REALIZADO

✅ **Função get-pending-enrollments**: Funcionando (retorna array vazio)  
✅ **Função get-enrollments**: Funcionando (retorna array vazio)  
❌ **Variáveis de ambiente**: NÃO CONFIGURADAS  

## 🛠️ SOLUÇÃO PASSO A PASSO

### 1. Acessar o Supabase Dashboard
```
https://supabase.com/dashboard
```

### 2. Navegar para as Configurações
- Selecione seu projeto: `eetad-sistema-v2`
- Vá em **Settings** (⚙️)
- Clique em **Environment Variables**

### 3. Configurar as Variáveis Obrigatórias

Adicione as seguintes variáveis:

#### GOOGLE_SERVICE_ACCOUNT_EMAIL
```
Nome: GOOGLE_SERVICE_ACCOUNT_EMAIL
Valor: seu-email@projeto.iam.gserviceaccount.com
```

#### GOOGLE_PRIVATE_KEY
```
Nome: GOOGLE_PRIVATE_KEY
Valor: -----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----
```

### 4. Obter as Credenciais do Google

Se você não tem as credenciais, siga estes passos:

#### 4.1 Criar Service Account
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **IAM & Admin** > **Service Accounts**
3. Clique em **Create Service Account**
4. Nome: `eetad-sheets-service`
5. Clique em **Create and Continue**

#### 4.2 Gerar Chave JSON
1. Na lista de Service Accounts, clique nos 3 pontos
2. Selecione **Manage Keys**
3. Clique em **Add Key** > **Create New Key**
4. Escolha **JSON** e clique em **Create**
5. Baixe o arquivo JSON

#### 4.3 Extrair as Informações
Do arquivo JSON baixado, extraia:
- `client_email` → **GOOGLE_SERVICE_ACCOUNT_EMAIL**
- `private_key` → **GOOGLE_PRIVATE_KEY**

### 5. Configurar Permissões na Planilha

#### 5.1 Compartilhar a Planilha
1. Abra a planilha: `controle alunos`
2. Clique em **Compartilhar**
3. Adicione o email da service account
4. Defina permissão como **Editor**

#### 5.2 Verificar ID da Planilha
- URL da planilha: `https://docs.google.com/spreadsheets/d/1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA/edit`
- ID: `1BKet2O-aSnNKPRflC24PxnOQikVA5k9RhzmBiJtzhAA` ✅ (já configurado)

### 6. Verificar Estrutura da Planilha

Na aba **"dados pessoais"**, certifique-se de que:

- **Coluna 23 (índice 22)**: Contém o campo **"status"**
- **Valores aceitos**: "Pendente", "Matriculado", "Finalizado"
- **Alunos pendentes**: Devem ter status = "Pendente"

### 7. Testar a Configuração

Após configurar as variáveis, execute:

```bash
node testar-google-sheets-config.js
```

**Resultado esperado:**
```
📋 Testando função get-pending-enrollments...
   Status: 200
   ✅ Resposta recebida: [{"id":"2","nome":"João Silva","cpf":"123.456.789-00",...}]
   📊 Total de matrículas pendentes: 3
```

## 🔄 REINICIAR FUNÇÕES SUPABASE

Após configurar as variáveis, pode ser necessário reiniciar as funções:

1. No Supabase Dashboard
2. Vá em **Edge Functions**
3. Clique em **Restart** nas funções:
   - `get-pending-enrollments`
   - `get-enrollments`

## ✅ VERIFICAÇÃO FINAL

1. **Acesse o sistema da secretaria**
2. **Vá em "Matrículas Pendentes"**
3. **Verifique se os alunos aparecem**

## 🆘 TROUBLESHOOTING

### Problema: Ainda não aparecem alunos
**Verificar:**
- [ ] Variáveis configuradas corretamente
- [ ] Service account tem acesso à planilha
- [ ] Existem alunos com status "Pendente"
- [ ] Coluna de status está na posição correta (coluna 23)

### Problema: Erro 401/403
**Solução:**
- Verificar se a service account foi compartilhada na planilha
- Confirmar permissões de Editor

### Problema: Erro 404
**Solução:**
- Verificar ID da planilha
- Confirmar nome da aba: "dados pessoais"

## 📞 SUPORTE

Se o problema persistir:
1. Execute: `node testar-google-sheets-config.js`
2. Envie o resultado completo
3. Verifique os logs no Supabase Dashboard > Edge Functions

---

**⚡ IMPORTANTE**: Após configurar as variáveis no Supabase, aguarde 1-2 minutos para que as mudanças sejam aplicadas nas funções.