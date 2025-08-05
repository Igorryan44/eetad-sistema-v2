# 🚀 Deploy na Vercel - Guia Passo a Passo

## ✅ Status Atual
- ✅ CLI da Verce- ✅ Build de produção criado
- ✅ Configuração `vercel.json` atualizada com variáveis de ambiente
- ✅ Scripts de criação de repositório GitHub prontos
- ⏳ Login na Vercel em andamento

## 🔐 Passo 1: Fazer Login na Vercel

**O comando `vercel login` está rodando no terminal.**

Escolha uma das opções:
- **Continue with GitHub** (Recomendado)
- Continue with Google
- Continue with Email

Use as setas ↑↓ para navegar e Enter para confirmar.

## 🚀 Passo 2: Deploy Automático

Após o login, execute:
```bash
vercel --prod
```

A Vercel irá:
1. Detectar automaticamente que é um projeto Vite/React
2. Configurar o build automaticamente
3. Fazer o deploy
4. Fornecer uma URL de produção

## 🌐 Passo 3: Configurar Domínio Customizado

Após o deploy bem-sucedido:

1. **Acesse**: https://vercel.com/dashboard
2. **Encontre seu projeto**: `eetad-sistema-matricula`
3. **Vá em**: Settings > Domains
4. **Adicione**: `eetadnucleopalmas.shop`
5. **Configure DNS** conforme instruído pela Vercel

## ⚙️ Configurações Importantes

### Variáveis de Ambiente
Na dashboard da Vercel, adicione:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MERCADOPAGO_PUBLIC_KEY`
- E outras conforme necessário

### Build Settings (Já Configurado)
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 🔧 Arquivo vercel.json (Atualizado)

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@vite_supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@vite_supabase_anon_key",
    "VITE_MERCADOPAGO_PUBLIC_KEY": "@vite_mercadopago_public_key",
    "VITE_APP_NAME": "EETAD - Núcleo Palmas",
    "VITE_APP_URL": "https://eetadnucleopalmas.shop"
  },
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

## 🎯 Próximos Passos

1. **Complete o login** no terminal
2. **Execute**: `vercel --prod`
3. **Configure o domínio** na dashboard
4. **Teste a aplicação** na URL fornecida
5. **Verifique as integrações** (Supabase, MercadoPago, etc.)

## 🔄 Fluxo Completo de Implantação

1. **Criar repositório GitHub**
   - Use o script `Criar-Repositorio.ps1` ou o guia HTML `criar-repositorio.html`
   - Ou siga as instruções em `GITHUB-SETUP.md`

2. **Fazer login na Vercel**
   ```bash
   vercel login
   ```

3. **Implantar em produção**
   ```bash
   vercel --prod
   ```

4. **Configurar domínio personalizado**
   ```bash
   vercel domains add eetadnucleopalmas.shop
   ```

## 🆘 Solução de Problemas

- **Erro 404 em rotas**: Verifique se o arquivo `vercel.json` está configurado corretamente
 - **Falha na integração**: Verifique as variáveis de ambiente
 - **Falha na implantação**: Verifique os logs de build no painel do Vercel
 - **Problemas de permissão GitHub**: Consulte `GITHUB-PERMISSION-FIX.md`

## 📊 Comandos Úteis

```bash
# Deploy de produção
vercel --prod

# Ver logs
vercel logs

# Listar deployments
vercel list

# Ver informações do projeto
vercel ls

# Remover projeto
vercel remove eetad-sistema-matricula
```

---

**💡 Dica**: A Vercel é perfeita para projetos React e oferece deploy automático via GitHub!