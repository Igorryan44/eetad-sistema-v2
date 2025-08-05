# Configuração MercadoPago - Resolução Definitiva PIX e QR Code

## 🎯 Objetivo
Este guia resolve definitivamente o problema de geração de PIX e QR Code no sistema EETAD.

## 🔧 Configuração Necessária

### 1. Token MercadoPago
O sistema precisa do `MERCADOPAGO_ACCESS_TOKEN` configurado no Supabase.

#### Como obter o token:
1. **Sandbox (Testes):**
   - Acesse: https://www.mercadopago.com.br/developers/panel
   - Vá em "Suas integrações" → "Criar aplicação"
   - Copie o "Access Token" da seção **Sandbox**

2. **Produção:**
   - Use o "Access Token" da seção **Produção**
   - ⚠️ **IMPORTANTE**: Só use produção quando tudo estiver testado

#### Como configurar no Supabase:
1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Vá em "Project Settings" → "Environment Variables"
3. Adicione a variável:
   - **Nome**: `MERCADOPAGO_ACCESS_TOKEN`
   - **Valor**: Seu token do MercadoPago

### 2. Outras Variáveis Necessárias
Certifique-se de que estas variáveis também estão configuradas:

```
GOOGLE_SHEETS_SPREADSHEET_ID=sua_planilha_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=seu_email_service_account
GOOGLE_PRIVATE_KEY=sua_chave_privada
```

## 🚀 Testando a Configuração

### Teste Rápido via Browser
1. Abra: http://localhost:3000
2. Faça um pedido de livro
3. Vá até o checkout
4. Verifique se o QR Code é gerado

### Teste via API Direta
```bash
curl -X POST https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/create-mercadopago-payment \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste Sistema",
    "cpf": "12345678901",
    "email": "teste@eetad.com.br",
    "valor": 25.50,
    "livro": "Livro Teste",
    "ciclo": "1º Ciclo Básico"
  }'
```

## 📋 Checklist de Verificação

- [ ] Token MercadoPago configurado no Supabase
- [ ] Variáveis do Google Sheets configuradas
- [ ] Funções Supabase deployadas
- [ ] Teste de criação de PIX funcionando
- [ ] QR Code sendo gerado corretamente
- [ ] Webhook recebendo notificações
- [ ] Pagamentos sendo salvos na planilha

## 🔍 Diagnóstico de Problemas

### Erro 401 - "Missing authorization header"
- **Causa**: Token não configurado ou inválido
- **Solução**: Verificar e reconfigurar o `MERCADOPAGO_ACCESS_TOKEN`

### QR Code não aparece
- **Causa**: Resposta da API não contém `qr_code_base64`
- **Solução**: Verificar logs da função `create-mercadopago-payment`

### Pagamento não é confirmado
- **Causa**: Webhook não está funcionando
- **Solução**: Verificar logs da função `mercadopago-webhook`

## 📞 URLs das Funções

- **Criar Pagamento**: `https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/create-mercadopago-payment`
- **Verificar Status**: `https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/check-payment-status`
- **Webhook**: `https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/mercadopago-webhook`
- **Cancelar Pedido**: `https://umkizxftwrwqiiahjbrr.supabase.co/functions/v1/cancel-order`

## 🎯 Próximos Passos

1. Configure o token MercadoPago
2. Teste a geração de PIX
3. Verifique o recebimento de webhooks
4. Confirme que os pagamentos são salvos na planilha
5. Teste o fluxo completo no frontend

---

**✅ Após seguir este guia, o sistema de PIX e QR Code estará funcionando perfeitamente!**