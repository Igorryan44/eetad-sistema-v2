#!/bin/bash

# 🚀 Script de Deploy - EETAD Sistema de Matrícula
# Domínio: eetadnucleopalmas.shop

echo "🚀 Iniciando processo de deploy..."

# Verificar se o build existe
if [ ! -d "dist" ]; then
    echo "📦 Criando build de produção..."
    npm run build
else
    echo "✅ Build encontrado na pasta dist/"
fi

echo ""
echo "🌐 Escolha a plataforma de deploy:"
echo "1) Netlify (Recomendado)"
echo "2) Vercel"
echo "3) GitHub Pages"
echo "4) Upload manual (FTP/cPanel)"
echo ""

read -p "Digite sua escolha (1-4): " choice

case $choice in
    1)
        echo "🔵 Deploy com Netlify..."
        if ! command -v netlify &> /dev/null; then
            echo "📦 Instalando Netlify CLI..."
            npm install -g netlify-cli
        fi
        echo "🔐 Faça login no Netlify (abrirá no navegador):"
        netlify login
        echo "🚀 Fazendo deploy..."
        netlify deploy --dir=dist --prod
        echo "✅ Deploy concluído! Configure seu domínio customizado no painel do Netlify."
        ;;
    2)
        echo "⚡ Deploy com Vercel..."
        if ! command -v vercel &> /dev/null; then
            echo "📦 Instalando Vercel CLI..."
            npm install -g vercel
        fi
        echo "🔐 Faça login no Vercel:"
        vercel login
        echo "🚀 Fazendo deploy..."
        vercel --prod
        echo "✅ Deploy concluído! Configure seu domínio customizado no painel do Vercel."
        ;;
    3)
        echo "🐙 Configuração para GitHub Pages..."
        echo "1. Faça push do código para um repositório GitHub"
        echo "2. Vá em Settings > Pages no repositório"
        echo "3. Configure GitHub Actions como source"
        echo "4. O workflow já está configurado em .github/workflows/deploy.yml"
        echo "5. Configure seu domínio customizado nas configurações do Pages"
        ;;
    4)
        echo "📁 Upload manual..."
        echo "1. Acesse seu painel de hospedagem (cPanel/FTP)"
        echo "2. Faça upload de todos os arquivos da pasta 'dist/' para o diretório público"
        echo "3. Configure o DNS do domínio para apontar para seu servidor"
        echo "4. Certifique-se de que o arquivo .htaccess está configurado para SPA"
        ;;
    *)
        echo "❌ Opção inválida!"
        exit 1
        ;;
esac

echo ""
echo "📋 Próximos passos:"
echo "1. Configure o DNS do domínio eetadnucleopalmas.shop"
echo "2. Adicione as variáveis de ambiente necessárias"
echo "3. Teste todas as funcionalidades no ambiente de produção"
echo "4. Configure certificado SSL (geralmente automático)"
echo ""
echo "🎉 Deploy preparado com sucesso!"