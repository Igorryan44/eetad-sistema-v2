# 📧 Configuração de Emails - Sistema EETAD

Este documento explica como configurar o envio automático de emails de confirmação para matrícula e pagamentos.

## 🎯 Funcionalidades de Email

### ✅ Emails Implementados

1. **Email de Confirmação de Matrícula**
   - Enviado automaticamente quando um aluno se matricula
   - Contém dados da matrícula e próximos passos
   - Template HTML responsivo

2. **Email de Confirmação de Pagamento**
   - Enviado automaticamente quando um pagamento é aprovado
   - Contém detalhes do pagamento e informações sobre envio
   - Template HTML responsivo

## ⚙️ Configuração

### 1. Configurar Gmail (Recomendado)

#### Passo 1: Ativar Verificação em 2 Etapas
1. Acesse [myaccount.google.com](https://myaccount.google.com)
2. Vá em **Segurança** → **Verificação em duas etapas**
3. Ative a verificação em 2 etapas

#### Passo 2: Gerar Senha de App
1. Ainda em **Segurança**, procure por **Senhas de app**
2. Selecione **Email** como aplicativo
3. Copie a senha gerada (16 caracteres)

#### Passo 3: Configurar Variáveis de Ambiente
Adicione no Supabase Dashboard (Settings → Environment Variables):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_de_app_16_caracteres
FROM_EMAIL=seu_email@gmail.com
FROM_NAME=EETAD - Núcleo Palmas TO
```

### 2. Outras Opções de Email

#### Opção A: Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=seu_email@outlook.com
SMTP_PASSWORD=sua_senha
```

#### Opção B: Yahoo Mail
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=seu_email@yahoo.com
SMTP_PASSWORD=sua_senha_de_app
```

#### Opção C: Serviços Profissionais (SendGrid, Resend, etc.)
Para produção, recomenda-se usar serviços especializados:

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=sua_api_key_sendgrid
```

**Resend:**
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=sua_api_key_resend
```

## 🔧 Configuração no Supabase

### 1. Adicionar Variáveis de Ambiente
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione as variáveis de email:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_de_app
FROM_EMAIL=seu_email@gmail.com
FROM_NAME=EETAD - Núcleo Palmas TO
```

### 2. Reiniciar Edge Functions
Após adicionar as variáveis, reinicie as Edge Functions:
1. Vá em **Edge Functions**
2. Clique em **Restart** nas funções:
   - `send-email-notification`
   - `mercadopago-webhook`
   - `save-student-registration`

## 📋 Templates de Email

### Template de Matrícula
- **Assunto:** ✅ Matrícula Confirmada - EETAD Núcleo Palmas TO
- **Conteúdo:** Dados da matrícula, próximos passos, informações de contato
- **Design:** HTML responsivo com cores da EETAD

### Template de Pagamento
- **Assunto:** 💰 Pagamento Confirmado - EETAD Núcleo Palmas TO
- **Conteúdo:** Detalhes do pagamento, informações sobre envio
- **Design:** HTML responsivo com badge de aprovação

## 🧪 Teste de Configuração

### 1. Teste Manual
Para testar se os emails estão funcionando:

1. **Teste de Matrícula:**
   - Faça uma matrícula de teste no sistema
   - Verifique se o email chegou na caixa de entrada

2. **Teste de Pagamento:**
   - Faça um pagamento de teste
   - Verifique se o email de confirmação chegou

### 2. Logs de Debug
Monitore os logs no Supabase:
1. Vá em **Edge Functions**
2. Clique na função `send-email-notification`
3. Verifique os logs para ver se há erros

## 🚨 Solução de Problemas

### Problema: Email não está sendo enviado

**Verificações:**
1. ✅ Variáveis de ambiente configuradas corretamente
2. ✅ Senha de app gerada (não usar senha normal)
3. ✅ Verificação em 2 etapas ativada no Gmail
4. ✅ Edge Functions reiniciadas após configuração

### Problema: Email vai para spam

**Soluções:**
1. Configure SPF, DKIM e DMARC no seu domínio
2. Use um serviço profissional (SendGrid, Resend)
3. Peça aos usuários para adicionar seu email aos contatos

### Problema: Limite de envio atingido

**Gmail:** 500 emails/dia para contas gratuitas
**Solução:** Use um serviço profissional para maior volume

## 📊 Monitoramento

### Logs Importantes
Monitore estes logs no Supabase:

```
✅ Email de confirmação de matrícula enviado
✅ Email de confirmação de pagamento enviado com sucesso
❌ Erro ao enviar email de confirmação: [erro]
```

### Métricas Recomendadas
- Taxa de entrega de emails
- Emails que vão para spam
- Tempo de resposta do SMTP

## 🔒 Segurança

### Boas Práticas
1. **Nunca** commite senhas no código
2. Use senhas de app, não senhas normais
3. Monitore tentativas de login suspeitas
4. Considere rotacionar senhas periodicamente

### Configuração Segura
- Use SMTP com TLS (porta 587)
- Mantenha credenciais apenas no Supabase
- Configure rate limiting se necessário

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs no Supabase
2. Teste as credenciais SMTP manualmente
3. Consulte a documentação do provedor de email
4. Entre em contato com o suporte técnico

---

**Última atualização:** Janeiro 2024  
**Versão:** 1.0