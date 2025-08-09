# 🎯 GUIA FINAL: Como Resolver as Matrículas Pendentes

## ✅ **PROGRESSO ATUAL**

- ✅ **Problema identificado:** Índices incorretos na função `get-pending-enrollments`
- ✅ **Correção aplicada:** Função corrigida para usar os índices corretos
- ✅ **Deploy realizado:** Função atualizada no Supabase com sucesso
- ⚠️ **Pendente:** Configuração das credenciais do Google Sheets

## 🔧 **PRÓXIMO PASSO: Configurar Credenciais Google Sheets**

### 📋 **1. Acesse o Supabase Dashboard**
🔗 **Link direto:** https://supabase.com/dashboard/project/umkizxftwrwqiiahjbrr/settings/environment-variables

### 📋 **2. Adicione as 3 Variáveis de Ambiente**

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email da service account | `service-account@projeto.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | Chave privada da service account | `-----BEGIN PRIVATE KEY-----\n...` |
| `GOOGLE_SHEETS_ID` | ID da planilha "controle alunos" | `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms` |

### 📋 **3. Como Obter as Credenciais (se não tiver)**

1. **Acesse:** https://console.cloud.google.com/
2. **Crie/selecione** um projeto
3. **Ative** a API do Google Sheets
4. **Crie** uma Service Account
5. **Baixe** o arquivo JSON com as credenciais
6. **Compartilhe** a planilha com o email da service account

### 📋 **4. Extrair Informações do JSON**

Do arquivo JSON baixado, você precisará:

```json
{
  "client_email": "service-account@projeto.iam.gserviceaccount.com", // ← GOOGLE_SERVICE_ACCOUNT_EMAIL
  "private_key": "-----BEGIN PRIVATE KEY-----\n...", // ← GOOGLE_PRIVATE_KEY
}
```

### 📋 **5. Obter o ID da Planilha**

Na URL da planilha "controle alunos":
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                      ↑ Este é o GOOGLE_SHEETS_ID
```

## 🧪 **TESTE APÓS CONFIGURAÇÃO**

Após configurar as credenciais, aguarde **2-3 minutos** e execute:

```bash
node diagnosticar-matriculas-pendentes.js
```

**Resultado esperado:**
```
✅ Resposta recebida: 2 alunos pendentes encontrados

📋 ALUNOS PENDENTES:
   1. Simião Alves da Costa Junior
   2. Bruno Alexandre Barros dos Santos
```

## 🎯 **VERIFICAÇÃO FINAL**

1. **Acesse** o Dashboard da secretaria
2. **Verifique** se os 2 alunos aparecem na seção "Matrículas Pendentes"
3. **Confirme** que os dados estão corretos (nome, CPF, email, telefone)

## 📋 **ESTRUTURA CORRIGIDA (Para Referência)**

A função agora usa os índices corretos da aba "dados pessoais":

| Campo | Índice | Coluna |
|-------|--------|--------|
| Nome | 4 | E |
| CPF | 6 | G |
| Telefone | 7 | H |
| Email | 8 | I |

## 🚨 **IMPORTANTE**

- ✅ **A correção do código já foi feita e deployada**
- ⚠️ **Só falta configurar as credenciais do Google Sheets**
- 🎯 **Após configurar, os alunos aparecerão automaticamente**

## 📞 **Suporte**

Se após configurar as credenciais os alunos ainda não aparecerem:

1. Verifique se a planilha foi compartilhada com a service account
2. Confirme se o ID da planilha está correto
3. Aguarde alguns minutos para propagação das configurações
4. Execute novamente o script de diagnóstico

---

**🎉 Resumo:** O problema foi identificado e corrigido. Agora só precisa configurar as credenciais do Google Sheets no Supabase para que tudo funcione perfeitamente!