# Configuração Google Sheets - Sistema EETAD

## 🎯 Objetivo
Este guia resolve definitivamente a configuração das credenciais do Google Sheets para o sistema EETAD.

## ❌ Erro Atual
```
net::ERR_CONNECTION_REFUSED http://localhost:5173/
```

Este erro indica que as **credenciais do Google Sheets não estão configuradas** corretamente.

## 🔧 Configuração Necessária

### 1. Credenciais do Google Sheets
O sistema precisa de 3 variáveis configuradas:

```
GOOGLE_SHEETS_SPREADSHEET_ID=sua_planilha_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=seu_email_service_account
GOOGLE_PRIVATE_KEY=sua_chave_privada
```

### 2. Como Obter as Credenciais

#### Passo 1: Criar Projeto no Google Cloud
1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Anote o nome do projeto

#### Passo 2: Ativar API do Google Sheets
1. No painel do Google Cloud, vá em **"APIs & Services"** → **"Library"**
2. Procure por **"Google Sheets API"**
3. Clique em **"Enable"**

#### Passo 3: Criar Service Account
1. Vá em **"APIs & Services"** → **"Credentials"**
2. Clique em **"Create Credentials"** → **"Service Account"**
3. Preencha:
   - **Service account name**: `eetad-sheets-service`
   - **Service account ID**: `eetad-sheets-service`
   - **Description**: `Service Account para integração EETAD com Google Sheets`
4. Clique em **"Create and Continue"**
5. Pule as próximas etapas clicando em **"Done"**

#### Passo 4: Gerar Chave JSON
1. Na lista de Service Accounts, clique na que você criou
2. Vá na aba **"Keys"**
3. Clique em **"Add Key"** → **"Create new key"**
4. Escolha **"JSON"** e clique em **"Create"**
5. O arquivo JSON será baixado automaticamente

#### Passo 5: Extrair Informações do JSON
Abra o arquivo JSON baixado e extraia:

```json
{
  "client_email": "eetad-sheets-service@seu-projeto.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----\n"
}
```

- **GOOGLE_SERVICE_ACCOUNT_EMAIL** = valor de `client_email`
- **GOOGLE_PRIVATE_KEY** = valor de `private_key` (com as quebras de linha \n)

### 3. Configurar a Planilha

#### Passo 1: Criar/Preparar Planilha
1. Acesse: https://sheets.google.com/
2. Crie uma nova planilha ou use uma existente
3. Anote o **ID da planilha** (da URL):
   ```
   https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit
   ```

#### Passo 2: Criar Abas Necessárias
Sua planilha deve ter estas abas:
- **alunos matriculados** (dados dos alunos)
- **pedidos** (pedidos de livros)
- **pagamentos** (controle de pagamentos)

#### Passo 3: Configurar Cabeçalhos da Aba "pagamentos"
Na aba **"pagamentos"**, adicione estes cabeçalhos na primeira linha:

| A | B | C | D | E | F | G | H | I |
|---|---|---|---|---|---|---|---|---|
| ID Pagamento | CPF | Nome | Livro | Ciclo | Valor | Status | Data Confirmação | Referência Externa |

#### Passo 4: Compartilhar com Service Account
1. Na planilha, clique em **"Compartilhar"**
2. Adicione o email da Service Account (ex: `eetad-sheets-service@seu-projeto.iam.gserviceaccount.com`)
3. Defina permissão como **"Editor"**
4. Clique em **"Enviar"**

## 🚀 Configuração Automática

### Opção 1: Script Automático
Execute o script de configuração:

```bash
node setup-google-sheets.js
```

Este script irá:
1. Solicitar as credenciais
2. Testar a conexão
3. Salvar no arquivo `.env`
4. Mostrar instruções para o Supabase

### Opção 2: Configuração Manual

#### No arquivo .env local:
```bash
# Copie o .env.example
cp .env.example .env

# Edite o .env e adicione:
GOOGLE_SHEETS_SPREADSHEET_ID=seu_id_da_planilha
GOOGLE_SERVICE_ACCOUNT_EMAIL=eetad-sheets-service@seu-projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----\n"
```

#### No Supabase Dashboard:
1. Acesse: https://supabase.com/dashboard
2. Vá em **"Project Settings"** → **"Environment Variables"**
3. Adicione as 3 variáveis:
   - `GOOGLE_SHEETS_SPREADSHEET_ID`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`

## 🧪 Testando a Configuração

### Teste 1: Verificar Variáveis
```bash
# No terminal do projeto
echo $GOOGLE_SHEETS_SPREADSHEET_ID
echo $GOOGLE_SERVICE_ACCOUNT_EMAIL
echo $GOOGLE_PRIVATE_KEY
```

### Teste 2: Testar Função Supabase
```bash
curl -X POST https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/save-pending-payment \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": "teste123",
    "nome": "Teste Sistema",
    "valor": 25.50,
    "external_reference": "12345678901|Livro Teste|1º Ciclo Básico"
  }'
```

### Teste 3: Verificar na Planilha
1. Abra sua planilha Google Sheets
2. Vá na aba **"pagamentos"**
3. Verifique se apareceu uma nova linha com os dados do teste

## 🔍 Diagnóstico de Problemas

### Erro: "Configuração do Google Sheets incompleta"
- **Causa**: Uma ou mais variáveis não estão configuradas
- **Solução**: Verificar se todas as 3 variáveis estão no Supabase

### Erro: "403 Forbidden"
- **Causa**: Service Account não tem acesso à planilha
- **Solução**: Compartilhar a planilha com o email da Service Account

### Erro: "404 Not Found"
- **Causa**: ID da planilha incorreto
- **Solução**: Verificar o ID na URL da planilha

### Erro: "401 Unauthorized"
- **Causa**: Credenciais inválidas
- **Solução**: Regenerar a chave JSON da Service Account

## 📋 Checklist de Verificação

- [ ] Projeto criado no Google Cloud
- [ ] API Google Sheets ativada
- [ ] Service Account criada
- [ ] Chave JSON baixada
- [ ] Planilha criada com abas corretas
- [ ] Planilha compartilhada com Service Account
- [ ] Variáveis configuradas no .env local
- [ ] Variáveis configuradas no Supabase
- [ ] Teste de conexão bem-sucedido
- [ ] Dados sendo salvos na planilha

## 🎯 Próximos Passos

1. **Configure as credenciais** seguindo este guia
2. **Teste a conexão** com os comandos fornecidos
3. **Reinicie o servidor** de desenvolvimento
4. **Teste o fluxo completo** no frontend
5. **Verifique os dados** na planilha Google Sheets

---

**✅ Após seguir este guia, o sistema estará integrado com Google Sheets e funcionando perfeitamente!**