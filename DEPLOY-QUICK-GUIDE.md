# 🚀 Guia Rápido de Deploy

## Para o domínio: eetadnucleopalmas.shop

### ⚡ Deploy Rápido com Netlify (Recomendado)

1. **Acesse**: https://netlify.com
2. **Faça login** ou crie uma conta
3. **Arraste a pasta `dist/`** para o painel do Netlify
4. **Configure o domínio customizado**:
   - Vá em Site settings > Domain management
   - Adicione `eetadnucleopalmas.shop`
   - Configure os DNS conforme instruído

### ⚡ Deploy Rápido com Vercel

1. **Acesse**: https://vercel.com
2. **Faça login** ou crie uma conta
3. **Importe o projeto** do GitHub ou arraste a pasta `dist/`
4. **Configure o domínio customizado**:
   - Vá em Settings > Domains
   - Adicione `eetadnucleopalmas.shop`

### 📋 Configuração DNS

Configure os seguintes registros no seu provedor de domínio:

```
Tipo: A
Nome: @
Valor: [IP do servidor da plataforma escolhida]

Tipo: CNAME
Nome: www
Valor: eetadnucleopalmas.shop
```

### 🔧 Variáveis de Ambiente

Não esqueça de configurar as variáveis de ambiente na plataforma escolhida:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MERCADOPAGO_PUBLIC_KEY`
- E outras conforme necessário

### ✅ Checklist Final

- [ ] Build criado (`npm run build`)
- [ ] Deploy realizado
- [ ] Domínio configurado
- [ ] DNS propagado
- [ ] SSL ativo
- [ ] Variáveis de ambiente configuradas
- [ ] Teste de todas as funcionalidades

### 🆘 Suporte

Se precisar de ajuda, consulte o arquivo `deploy-instructions.md` para instruções detalhadas.