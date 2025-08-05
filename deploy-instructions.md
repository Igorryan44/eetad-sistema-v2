# 🚀 Instruções de Deploy - EETAD Sistema de Matrícula

## 📋 Informações do Projeto
- **Domínio**: eetadnucleopalmas.shop
- **Aplicação**: Sistema de Matrícula EETAD
- **Build**: Gerado na pasta `dist/`

## ✅ Status do Build
- ✅ Build de produção criado com sucesso
- ✅ Aplicação testada localmente
- ✅ Arquivos de configuração criados
- ✅ Scripts de deploy preparados

## 🌐 Opções de Deploy

### 1. **Netlify (Recomendado - Gratuito)**
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Fazer login
netlify login

# Deploy da pasta dist
netlify deploy --dir=dist --prod

# Configurar domínio customizado no painel do Netlify
```

### 2. **Vercel (Gratuito)**
```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod

# Configurar domínio customizado no painel do Vercel
```

### 3. **GitHub Pages**
1. Criar repositório no GitHub
2. Fazer push do código
3. Configurar GitHub Actions para build automático
4. Configurar domínio customizado

### 4. **Hospedagem Tradicional (cPanel/FTP)**
1. Fazer upload dos arquivos da pasta `dist/` para o diretório público do servidor
2. Configurar o domínio para apontar para a pasta

## ⚙️ Configurações Necessárias

### DNS do Domínio
Para qualquer opção escolhida, você precisará configurar o DNS:

**Para Netlify/Vercel:**
- Tipo: CNAME
- Nome: @ (ou www)
- Valor: [URL fornecida pela plataforma]

**Para hospedagem tradicional:**
- Tipo: A
- Nome: @
- Valor: [IP do servidor]

### Variáveis de Ambiente
Certifique-se de que as seguintes variáveis estão configuradas:
- URLs do Supabase
- Chaves de API
- Configurações do MercadoPago

## 🔧 Configuração Específica para SPA (Single Page Application)

### Netlify - Criar `_redirects`
```
/*    /index.html   200
```

### Vercel - Criar `vercel.json`
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## 📝 Checklist Pré-Deploy
- [ ] Build gerado com sucesso
- [ ] Todas as funcionalidades testadas localmente
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio DNS configurado
- [ ] Certificado SSL configurado (automático na maioria das plataformas)

## 🚀 Deploy Rápido com Netlify (Recomendado)

1. Acesse [netlify.com](https://netlify.com)
2. Faça login/cadastro
3. Arraste a pasta `dist` para a área de deploy
4. Configure o domínio customizado nas configurações do site
5. Adicione as variáveis de ambiente necessárias

## 📞 Suporte
Em caso de dúvidas durante o deploy, consulte a documentação da plataforma escolhida ou entre em contato.